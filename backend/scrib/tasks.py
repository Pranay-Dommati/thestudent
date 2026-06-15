import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from scrib.models import StudyPack
from scrib.services.pdf_generation import generate_study_pack_pdf, PdfGenerationError
from authentication.views import send_email_via_ses
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task(bind=True, max_retries=1)
def generate_study_pack_task(self, study_pack_id, pages, title, user_id):
    logger.info(f"Starting async generation for StudyPack {study_pack_id}")
    
    try:
        pack = StudyPack.objects.get(pk=study_pack_id)
        user = User.objects.get(pk=user_id)
    except (StudyPack.DoesNotExist, User.DoesNotExist):
        logger.error(f"StudyPack {study_pack_id} or User {user_id} not found.")
        return

    try:
        # Progress callback: called once per completed image (from inside the
        # ThreadPoolExecutor as_completed loop). Writes pages_done to the DB
        # immediately so the status endpoint can return live progress to the frontend.
        def _on_page_done(pages_done_count: int):
            # The DB connection can go stale during the long AI generation (75s+ per batch).
            # close_old_connections() recycles any timed-out connection before writing.
            from django.db import close_old_connections
            close_old_connections()
            StudyPack.objects.filter(
                id=study_pack_id,
                status=StudyPack.STATUS_GENERATING
            ).update(pages_done=pages_done_count)

        # Generate the PDF
        pdf_result = generate_study_pack_pdf(
            pages,
            title=title,
            user_id=user_id,
            progress_callback=_on_page_done,
        )
        pdf_url = pdf_result.get('pdf_url')
        
        if not pdf_url:
            raise PdfGenerationError("No PDF URL returned.")
            
        # Update the database
        # Refresh connection after long AI generation just in case
        from django.db import connection
        connection.close()

        # Update pack status — ONLY if it hasn't been marked FAILED by cleanup_stuck_packs.
        # If cleanup already ran and refunded credits (status=FAILED), do not override to READY.
        # This prevents the race condition where:
        #   1. cleanup marks pack FAILED + refunds credits
        #   2. Celery finishes + sets status=READY → user gets free PDF
        updated_rows = StudyPack.objects.filter(
            id=study_pack_id,
            status=StudyPack.STATUS_GENERATING  # only update if still GENERATING
        ).update(
            status=StudyPack.STATUS_READY,
            pdf_url=pdf_url,
            s3_key=pdf_result.get('s3_key'),
        )

        if updated_rows == 0:
            # Pack was already marked FAILED by cleanup — do NOT deliver the PDF for free.
            logger.warning(
                f"[scrib] StudyPack {study_pack_id} was already marked FAILED by cleanup. "
                f"PDF generated but NOT delivered to prevent free credit exploit. "
                f"PDF URL: {pdf_url}"
            )
            return

        logger.info(f"[scrib] Status COMPLETE for StudyPack {study_pack_id}")

        # Invalidate cache so History page updates
        from django.core.cache import cache
        cache.delete(f'scrib_my_study_packs_api_{user_id}')

        
        # Send Email Notification
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        # We can construct an email body directly
        html_content = f"""
        <html>
          <body>
            <h2>Your Scrib notes are ready!</h2>
            <p>Hi {user.full_name or 'there'},</p>
            <p>Your study pack <strong>"{pack.title}"</strong> has been successfully generated.</p>
            <p>
              <a href="{frontend_url}/generate?tab=history" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;border:1px solid #1d4ed8;">
                View your notes
              </a>
            </p>
            <p>Or you can <a href="{pdf_url}">download the PDF directly</a>.</p>
            <br/>
            <p>Happy studying!</p>
            <p>The Scrib Team</p>
          </body>
        </html>
        """
        
        email_sent = send_email_via_ses(
            to_email=user.email,
            subject="Your Scrib notes are ready! 📝",
            html_content=html_content
        )
        if not email_sent:
            logger.warning(f"Failed to send email to {user.email} for StudyPack {study_pack_id}")
            
    except Exception as exc:
        logger.exception(f"Error generating study pack {study_pack_id}")
        from django.db import connection
        connection.close()
        pack = StudyPack.objects.get(id=study_pack_id)
        pack.status = StudyPack.STATUS_FAILED
        pack.save(update_fields=['status'])
        
        # Invalidate cache so History page updates
        from django.core.cache import cache
        cache.delete(f'scrib_my_study_packs_api_{user_id}')
        
        # Safely refund credits for the failed generation
        if pack.credits_used > 0:
            from scrib.models import CreditTransaction
            CreditTransaction.objects.create(
                user_id=user_id,
                direction=CreditTransaction.DIRECTION_CREDIT,
                credits=pack.credits_used,
                reason=CreditTransaction.REASON_REFUND,
                study_pack=pack,
            )
            logger.info(f"Refunded {pack.credits_used} credits to user {user_id} for failed StudyPack {study_pack_id}")
            
        # Optionally retry
        # raise self.retry(exc=exc, countdown=60)
