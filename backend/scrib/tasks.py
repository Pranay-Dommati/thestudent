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
        # Generate the PDF
        pdf_result = generate_study_pack_pdf(pages, title=title, user_id=user_id)
        pdf_url = pdf_result.get('pdf_url')
        
        if not pdf_url:
            raise PdfGenerationError("No PDF URL returned.")
            
        # Update the database
        # Refresh connection after long AI generation just in case
        from django.db import connection
        connection.close()

        # Update pack status
        pack = StudyPack.objects.get(id=study_pack_id)
        pack.status = StudyPack.STATUS_READY
        pack.pdf_url = pdf_url
        pack.s3_key = pdf_result.get('s3_key')
        pack.save(update_fields=['status', 'pdf_url', 's3_key'])
        
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
