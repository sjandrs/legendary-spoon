"""
PDF generation service for Advanced Field Service Management Module.
Implements REQ-009: dynamic PDF generation with conditional logic.
"""

import io
import logging
import tempfile
from typing import Optional

from django.conf import settings
from django.template import Context, Template
from django.utils import timezone

logger = logging.getLogger(__name__)


class PDFService:
    """Service for generating PDF documents from templates"""

    def __init__(self):
        self.weasyprint_available = False
        try:
            import weasyprint

            self.weasyprint_available = True
        except ImportError:
            logger.warning("WeasyPrint not installed. PDF generation will be disabled.")

    def generate_work_order_pdf(
        self, paperwork_template, work_order, output_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate PDF from PaperworkTemplate with WorkOrder data.
        Implements REQ-009: PDF generation with conditional logic.

        Args:
            paperwork_template: PaperworkTemplate instance
            work_order: WorkOrder instance
            output_path: Optional path to save PDF file

        Returns:
            Path to generated PDF file or None if failed
        """
        if not self.weasyprint_available:
            logger.error("WeasyPrint not available. Cannot generate PDF.")
            return None

        try:
            import weasyprint

            # Prepare context data for template rendering
            context_data = {
                "work_order": work_order,
                "project": work_order.project,
                "account": work_order.project.account if work_order.project else None,
                "contact": work_order.project.contact if work_order.project else None,
                "technician": None,  # Will be set if scheduled
                "line_items": work_order.line_items.all(),
                "company_name": getattr(settings, "COMPANY_NAME", "Converge"),
                "company_address": getattr(settings, "COMPANY_ADDRESS", ""),
                "company_phone": getattr(settings, "COMPANY_PHONE", ""),
                "generated_at": timezone.now(),
            }

            # Get technician if work order is scheduled
            scheduled_events = work_order.scheduled_events.filter(
                status="scheduled"
            ).first()
            if scheduled_events:
                context_data["technician"] = scheduled_events.technician
                context_data["scheduled_event"] = scheduled_events

            # Render template with context
            template = Template(paperwork_template.content)
            context = Context(context_data)
            html_content = template.render(context)

            # Add basic CSS styling if not present
            if "<style>" not in html_content and "<link" not in html_content:
                css_style = """
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .field-group { margin-bottom: 10px; }
                    .label { font-weight: bold; }
                    .signature-area {
                        border-top: 1px solid #000;
                        margin-top: 50px;
                        padding-top: 10px;
                        text-align: center;
                    }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
                """
                html_content = html_content.replace("<head>", f"<head>{css_style}")

            # Generate PDF
            if output_path:
                # Save to specified path
                weasyprint.HTML(string=html_content).write_pdf(output_path)
                logger.info(f"PDF generated successfully: {output_path}")
                return output_path
            else:
                # Save to temporary file
                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=".pdf"
                ) as tmp_file:
                    weasyprint.HTML(string=html_content).write_pdf(tmp_file.name)
                    logger.info(f"PDF generated successfully: {tmp_file.name}")
                    return tmp_file.name

        except Exception as e:
            logger.error(f"Failed to generate PDF: {str(e)}")
            return None

    def generate_service_report_pdf(
        self,
        work_order,
        technician_notes: str = "",
        signature_data: Optional[str] = None,
        output_path: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate a standard service report PDF.
        """
        if not self.weasyprint_available:
            logger.error("WeasyPrint not available. Cannot generate PDF.")
            return None

        try:
            import weasyprint

            # Build HTML content for service report
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Service Report - Work Order #{work_order.id}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
                    .header {{ text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }}
                    .company-name {{ font-size: 24px; font-weight: bold; color: #333; }}
                    .report-title {{ font-size: 18px; margin-top: 10px; }}
                    .section {{ margin-bottom: 25px; }}
                    .section-title {{ font-size: 16px; font-weight: bold; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }}
                    .field-row {{ margin-bottom: 8px; }}
                    .label {{ font-weight: bold; display: inline-block; width: 150px; }}
                    .value {{ color: #555; }}
                    .notes-box {{ border: 1px solid #ccc; padding: 15px; background-color: #f9f9f9; min-height: 100px; }}
                    .signature-area {{ margin-top: 50px; text-align: center; }}
                    .signature-line {{ border-top: 1px solid #000; width: 300px; margin: 20px auto; padding-top: 5px; }}
                    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                    th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
                    th {{ background-color: #f2f2f2; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">{getattr(settings, 'COMPANY_NAME', 'Converge')}</div>
                    <div class="report-title">Service Report</div>
                </div>

                <div class="section">
                    <h3 class="section-title">Work Order Information</h3>
                    <div class="field-row">
                        <span class="label">Work Order #:</span>
                        <span class="value">{work_order.id}</span>
                    </div>
                    <div class="field-row">
                        <span class="label">Description:</span>
                        <span class="value">{work_order.description}</span>
                    </div>
                    <div class="field-row">
                        <span class="label">Status:</span>
                        <span class="value">{work_order.status}</span>
                    </div>
                    <div class="field-row">
                        <span class="label">Created:</span>
                        <span class="value">{work_order.created_at.strftime('%B %d, %Y at %I:%M %p')}</span>
                    </div>
                </div>
            """

            # Add customer information if available
            if work_order.project and work_order.project.contact:
                contact = work_order.project.contact
                html_content += f"""
                <div class="section">
                    <h3 class="section-title">Customer Information</h3>
                    <div class="field-row">
                        <span class="label">Name:</span>
                        <span class="value">{contact.first_name} {contact.last_name}</span>
                    </div>
                    <div class="field-row">
                        <span class="label">Email:</span>
                        <span class="value">{contact.email}</span>
                    </div>
                    <div class="field-row">
                        <span class="label">Phone:</span>
                        <span class="value">{contact.phone_number}</span>
                    </div>
                """

                if work_order.project.account:
                    account = work_order.project.account
                    html_content += f"""
                    <div class="field-row">
                        <span class="label">Company:</span>
                        <span class="value">{account.name}</span>
                    </div>
                    <div class="field-row">
                        <span class="label">Address:</span>
                        <span class="value">{account.address}</span>
                    </div>
                    """

                html_content += "</div>"

            # Add line items if available
            line_items = work_order.line_items.all()
            if line_items:
                html_content += """
                <div class="section">
                    <h3 class="section-title">Services/Parts</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                """

                total_amount = 0
                for item in line_items:
                    html_content += f"""
                            <tr>
                                <td>{item.description}</td>
                                <td>{item.quantity}</td>
                                <td>${item.unit_price}</td>
                                <td>${item.total}</td>
                            </tr>
                    """
                    total_amount += item.total

                html_content += f"""
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="3">Total</th>
                                <th>${total_amount}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                """

            # Add technician notes
            html_content += f"""
            <div class="section">
                <h3 class="section-title">Technician Notes</h3>
                <div class="notes-box">{technician_notes or 'No notes provided.'}</div>
            </div>
            """

            # Add signature area
            html_content += """
            <div class="signature-area">
                <div class="signature-line">Customer Signature</div>
                <div style="margin-top: 30px;">
                    <div class="signature-line">Technician Signature</div>
                </div>
                <div style="margin-top: 20px; font-size: 12px; color: #666;">
                    Date: ___________________
                </div>
            </div>
            """

            html_content += """
            </body>
            </html>
            """

            # Generate PDF
            if output_path:
                weasyprint.HTML(string=html_content).write_pdf(output_path)
                logger.info(f"Service report PDF generated: {output_path}")
                return output_path
            else:
                with tempfile.NamedTemporaryFile(
                    delete=False, suffix=".pdf"
                ) as tmp_file:
                    weasyprint.HTML(string=html_content).write_pdf(tmp_file.name)
                    logger.info(f"Service report PDF generated: {tmp_file.name}")
                    return tmp_file.name

        except Exception as e:
            logger.error(f"Failed to generate service report PDF: {str(e)}")
            return None

    def generate_pdf_bytes(self, html_content: str) -> Optional[bytes]:
        """
        Generate PDF as bytes for in-memory operations.
        """
        if not self.weasyprint_available:
            return None

        try:
            import weasyprint

            pdf_buffer = io.BytesIO()
            weasyprint.HTML(string=html_content).write_pdf(pdf_buffer)
            pdf_buffer.seek(0)
            return pdf_buffer.getvalue()

        except Exception as e:
            logger.error(f"Failed to generate PDF bytes: {str(e)}")
            return None


# Singleton instance - created on first use to avoid import errors
pdf_service = None


def get_pdf_service():
    """Get PDF service singleton, creating it if needed"""
    global pdf_service
    if pdf_service is None:
        pdf_service = PDFService()
    return pdf_service
