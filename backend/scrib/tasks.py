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


@shared_task(bind=True, max_retries=0)
def organize_youtube_task(self, cache_key, url, meta_title, duration_seconds, lock_key=None):
    """Run the YouTube outline+expand pipeline and publish the result to cache.

    Lives on the Celery worker rather than a thread in the web service on
    purpose: gunicorn there runs with ``--max-requests 500``, so a worker
    process is recycled regularly and would kill an in-flight thread — and the
    browser polling this job supplies ~60 of those requests itself. A recycled
    worker meant the job silently stranded on "processing" forever.

    Progress and results travel through the cache (Redis in production), so it
    does not matter which process serves the polling requests. ``lock_key`` is
    the per-caller "one job in flight" lock the view took — released here so the
    caller can start another the moment this one settles.
    """
    # Imported here to keep task registration cheap at worker start-up.
    from django.core.cache import cache
    from scrib.services import youtube_notes
    from scrib.views import _write_job_state, PRICE_PER_CREDIT_RUPEES

    def _publish(stage, message):
        _write_job_state(cache_key, {'status': 'processing', 'stage': stage, 'message': message})

    try:
        result = youtube_notes.organize(url, meta_title, duration_seconds, progress=_publish)
        result['cost_rupees'] = result['total_pages'] * PRICE_PER_CREDIT_RUPEES
        _write_job_state(cache_key, {'status': 'ready', 'result': result})
        logger.info('[scrib-yt] job %s ready: %d pages', cache_key, result['total_pages'])
    except youtube_notes.VideoUnreadable as exc:
        _write_job_state(cache_key, {'status': 'failed', 'code': exc.code, 'message': exc.message})
    except Exception as exc:
        logger.exception('[scrib-yt] job %s crashed: %s', cache_key, exc)
        _write_job_state(cache_key, {
            'status': 'failed', 'code': 'video_unreadable',
            'message': "Something went wrong processing this video. Please try again.",
        })
    finally:
        if lock_key:
            try:
                cache.delete(lock_key)
            except Exception:
                pass  # 15-min TTL is the backstop


def send_generation_failed_email(user, pack_title, credits_refunded):
    """Notify the user their study pack generation failed and credits were refunded.

    Called both from this task's own except-block and from cleanup_stuck_packs
    (views.py) when a pack is detected as stalled/timed-out — without this,
    a failed generation was silent: the user would only find out by reopening
    the History tab themselves.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    plural = 's' if credits_refunded != 1 else ''
    html_content = f"""
    <html>
      <body>
        <h2>We couldn't generate your Scrib notes</h2>
        <p>Hi {user.full_name or 'there'},</p>
        <p>Something went wrong while generating your study pack <strong>"{pack_title}"</strong>, so we've stopped it.</p>
        <p>{credits_refunded} credit{plural} {'have' if plural else 'has'} been refunded to your account — no charge for this attempt.</p>
        <p>
          <a href="{frontend_url}/generate" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;border:1px solid #1d4ed8;">
            Try again
          </a>
        </p>
        <br/>
        <p>Sorry for the trouble!</p>
        <p>The Scrib Team</p>
      </body>
    </html>
    """
    try:
        email_sent = send_email_via_ses(
            to_email=user.email,
            subject="Your Scrib generation didn't complete",
            html_content=html_content,
        )
        if not email_sent:
            logger.warning(f"Failure-notification email not sent to {user.email}")
    except Exception as exc:
        logger.warning(f"Error sending failure-notification email to {user.email}: {exc}")


def send_payment_success_email(user, credits_added):
    """Notify the user their Razorpay payment succeeded and credits were added.

    Razorpay's own email only confirms the charge — this is our side's
    confirmation that the credits actually landed on the account. Called from
    the credit-adding branch in both VerifyPaymentView and razorpay_webhook,
    so whichever of those two wins the race to create the CreditTransaction
    is the one that sends it (no duplicate emails).
    """
    html_content = f"""
    <html>
      <body>
        <p>Hi {user.full_name or 'there'},</p>
        <p>Thank you for your purchase! Your payment was successful, and your credits have been added to your Scrib account.</p>
        <p>If you face any issues with your purchase or while using Scrib, please don't hesitate to reach out to us at easylearnova@gmail.com. We're happy to help!</p>
        <p>Thank you for choosing Scrib.</p>
        <br/>
        <p>
          Pranay<br/>
          Founder, EasyLearnova<br/>
          Scrib – AI Handwritten Notes Generator
        </p>
      </body>
    </html>
    """
    try:
        email_sent = send_email_via_ses(
            to_email=user.email,
            subject="Payment Successful! 🎉",
            html_content=html_content,
        )
        if not email_sent:
            logger.warning(f"Payment-success email not sent to {user.email}")
    except Exception as exc:
        logger.warning(f"Error sending payment-success email to {user.email}: {exc}")


def send_pack_purchase_success_email(user, item_label, quiz_count=None):
    """Notify the user their Interview Prep pack/bundle purchase succeeded.

    A pack purchase grants access to notes + quizzes, not credits — reusing
    send_payment_success_email's "credits have been added" copy for this was
    misleading buyers into thinking they'd bought credits. Called from
    PackPurchaseVerifyView once the entitlement is actually granted.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    quizzes_line = f' and all {quiz_count} quizzes' if quiz_count else ''
    html_content = f"""
    <html>
      <body>
        <p>Hi {user.full_name or 'there'},</p>
        <p>Thank you for your purchase! <strong>{item_label}</strong> is now unlocked on your Scrib account — the full handwritten notes{quizzes_line} are ready whenever you are.</p>
        <p>
          <a href="{frontend_url}/interview-prep" style="display:inline-block;padding:12px 24px;background-color:#1f3a5f;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
            Start studying
          </a>
        </p>
        <p>If you face any issues with your purchase or while using Scrib, please don't hesitate to reach out to us at easylearnova@gmail.com. We're happy to help!</p>
        <p>Thank you for choosing Scrib.</p>
        <br/>
        <p>
          Pranay<br/>
          Founder, EasyLearnova<br/>
          Scrib – AI Handwritten Notes Generator
        </p>
      </body>
    </html>
    """
    try:
        email_sent = send_email_via_ses(
            to_email=user.email,
            subject="Your pack is unlocked! 🎉",
            html_content=html_content,
        )
        if not email_sent:
            logger.warning(f"Pack-purchase email not sent to {user.email}")
    except Exception as exc:
        logger.warning(f"Error sending pack-purchase email to {user.email}: {exc}")


@shared_task(bind=True, max_retries=1)
def generate_study_pack_task(self, study_pack_id, pages, title, user_id):
    logger.info(f"Starting async generation for StudyPack {study_pack_id}")
    
    try:
        pack = StudyPack.objects.get(pk=study_pack_id)
        user = User.objects.get(pk=user_id)
    except (StudyPack.DoesNotExist, User.DoesNotExist):
        logger.error(f"StudyPack {study_pack_id} or User {user_id} not found.")
        return

    # Mark the moment a worker actually dequeued this task — distinct from
    # created_at, which is set the instant the user hits Generate (status is
    # already GENERATING then, even while queued behind other busy workers).
    # cleanup_stuck_packs relies on this to never fail a pack that's merely
    # waiting for a free worker slot, not actually stuck/dead.
    from django.utils import timezone
    now = timezone.now()
    StudyPack.objects.filter(id=study_pack_id).update(started_at=now, updated_at=now)

    try:
        # Progress callback: called once per completed image (from inside the
        # ThreadPoolExecutor as_completed loop). Writes pages_done to the DB
        # immediately so the status endpoint can return live progress to the frontend.
        def _on_page_done(pages_done_count: int):
            # The DB connection can go stale during the long AI generation (75s+ per batch).
            # close_old_connections() recycles any timed-out connection before writing.
            from django.db import close_old_connections
            from django.utils import timezone
            close_old_connections()
            StudyPack.objects.filter(
                id=study_pack_id,
                status=StudyPack.STATUS_GENERATING
            ).update(pages_done=pages_done_count, updated_at=timezone.now())

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

        send_generation_failed_email(user, pack.title, pack.credits_used)

        # Optionally retry
        # raise self.retry(exc=exc, countdown=60)

@shared_task(bind=True)
def send_broadcast_chunk_task(self, chunk_emails, subject, html_content, chunk_index, total_chunks):
    """
    Worker task that sends a mini-chunk of up to 50 emails (~4 seconds duration).
    Because each task takes only ~4 seconds, the worker thread yields back to the Redis queue
    frequently, allowing user note generation (`generate_study_pack_task`) to be processed immediately without waiting!
    """
    import time
    from django.db import close_old_connections
    close_old_connections()
    
    sent_count = 0
    failed_count = 0
    
    for i, email in enumerate(chunk_emails):
        if email and '@' in email:
            try:
                success = send_email_via_ses(email, subject, html_content)
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as ex:
                logger.error(f"Failed sending broadcast email to {email}: {ex}")
                failed_count += 1
                
        # Rate limiting: pause 0.08s after each email (~12 emails/sec max)
        time.sleep(0.08)
        if (i + 1) % 14 == 0:
            time.sleep(0.2)
            
    logger.info(f"Broadcast chunk {chunk_index}/{total_chunks} completed for '{subject}': {sent_count} sent, {failed_count} failed.")
    return {"chunk_index": chunk_index, "sent": sent_count, "failed": failed_count}

@shared_task(bind=True)
def send_broadcast_email_task(self, recipient_emails, subject, html_content, target_group):
    """
    Master dispatcher task: Splits `recipient_emails` into mini-chunks of 50 emails
    and queues `send_broadcast_chunk_task` for each chunk.
    This ensures long campaigns never hold a Celery worker thread for more than 4 seconds at a time!
    """
    logger.info(f"Starting Celery master broadcast task '{subject}' to {len(recipient_emails)} users [{target_group}]")
    
    chunk_size = 50
    chunks = [recipient_emails[i:i + chunk_size] for i in range(0, len(recipient_emails), chunk_size)]
    total_chunks = len(chunks)
    
    for idx, chunk in enumerate(chunks, 1):
        send_broadcast_chunk_task.delay(chunk, subject, html_content, idx, total_chunks)
        
    logger.info(f"Dispatched {total_chunks} chunk tasks (50 emails each) for '{subject}' [{target_group}]")
    return {"status": "dispatched", "total_recipients": len(recipient_emails), "total_chunks": total_chunks}
