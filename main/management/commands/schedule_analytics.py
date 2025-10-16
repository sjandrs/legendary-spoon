"""
Cron-based analytics scheduling management command.
Provides scheduling functionality for environments without Celery.
"""
import os
import subprocess
import sys

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Set up cron jobs for analytics refresh scheduling"

    def add_arguments(self, parser):
        parser.add_argument(
            "--install",
            action="store_true",
            help="Install analytics refresh cron jobs",
        )
        parser.add_argument(
            "--remove",
            action="store_true",
            help="Remove analytics refresh cron jobs",
        )
        parser.add_argument(
            "--list",
            action="store_true",
            help="List current analytics cron jobs",
        )
        parser.add_argument(
            "--user",
            type=str,
            default=None,
            help="User for cron job (defaults to current user)",
        )

    def handle(self, *args, **options):
        if options["install"]:
            self.install_cron_jobs(options.get("user"))
        elif options["remove"]:
            self.remove_cron_jobs(options.get("user"))
        elif options["list"]:
            self.list_cron_jobs()
        else:
            self.stdout.write(
                self.style.ERROR("Please specify --install, --remove, or --list")
            )

    def install_cron_jobs(self, user=None):
        """Install analytics refresh cron jobs."""
        try:
            # Get Django management command path
            manage_py = os.path.join(settings.BASE_DIR, "manage.py")
            python_path = sys.executable

            # Define cron job entries
            cron_entries = [
                # Daily analytics refresh at 2 AM
                f"0 2 * * * cd {settings.BASE_DIR} && {python_path} {manage_py} "
                f"refresh_analytics --verbose >> /var/log/analytics_refresh.log 2>&1",
                # Weekly full refresh on Sundays at 1 AM
                f"0 1 * * 0 cd {settings.BASE_DIR} && {python_path} {manage_py} "
                f"refresh_analytics --force --verbose >> /var/log/analytics_refresh.log 2>&1",
                # Hourly refresh during business hours (9 AM - 6 PM, Mon-Fri)
                f"0 9-18 * * 1-5 cd {settings.BASE_DIR} && {python_path} {manage_py} "
                f"refresh_analytics >> /var/log/analytics_refresh.log 2>&1",
            ]

            # Get current crontab
            try:
                current_crontab = subprocess.check_output(
                    ["crontab", "-l"], stderr=subprocess.DEVNULL
                ).decode("utf-8")
            except subprocess.CalledProcessError:
                # No existing crontab
                current_crontab = ""

            # Check if analytics jobs already exist
            analytics_marker = "# Analytics refresh jobs"
            if analytics_marker in current_crontab:
                self.stdout.write(
                    self.style.WARNING(
                        "Analytics cron jobs already exist. "
                        "Use --remove to remove them first."
                    )
                )
                return

            # Add analytics jobs
            new_crontab = current_crontab.rstrip()
            if new_crontab:
                new_crontab += "\n"

            new_crontab += f"\n{analytics_marker}\n"
            for entry in cron_entries:
                new_crontab += f"{entry}\n"
            new_crontab += "# End analytics refresh jobs\n"

            # Install new crontab
            process = subprocess.Popen(
                ["crontab", "-"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            stdout, stderr = process.communicate(input=new_crontab)

            if process.returncode == 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully installed {len(cron_entries)} analytics cron jobs"
                    )
                )
                self.stdout.write("Scheduled jobs:")
                for entry in cron_entries:
                    self.stdout.write(f"  {entry}")
            else:
                raise CommandError(f"Failed to install cron jobs: {stderr}")

        except FileNotFoundError:
            raise CommandError(
                "crontab command not found. Please install cron or use Celery for scheduling."
            )
        except Exception as e:
            raise CommandError(f"Failed to install cron jobs: {e}")

    def remove_cron_jobs(self, user=None):
        """Remove analytics refresh cron jobs."""
        try:
            # Get current crontab
            try:
                current_crontab = subprocess.check_output(
                    ["crontab", "-l"], stderr=subprocess.DEVNULL
                ).decode("utf-8")
            except subprocess.CalledProcessError:
                self.stdout.write("No existing crontab found.")
                return

            # Remove analytics jobs
            analytics_marker = "# Analytics refresh jobs"
            end_marker = "# End analytics refresh jobs"

            if analytics_marker not in current_crontab:
                self.stdout.write("No analytics cron jobs found.")
                return

            # Split and filter out analytics jobs
            lines = current_crontab.split("\n")
            filtered_lines = []
            in_analytics_section = False

            for line in lines:
                if line.strip() == analytics_marker:
                    in_analytics_section = True
                    continue
                elif line.strip() == end_marker:
                    in_analytics_section = False
                    continue
                elif not in_analytics_section:
                    filtered_lines.append(line)

            # Install filtered crontab
            new_crontab = "\n".join(filtered_lines).strip()
            if new_crontab:
                new_crontab += "\n"

            process = subprocess.Popen(
                ["crontab", "-"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            stdout, stderr = process.communicate(input=new_crontab)

            if process.returncode == 0:
                self.stdout.write(
                    self.style.SUCCESS("Successfully removed analytics cron jobs")
                )
            else:
                raise CommandError(f"Failed to remove cron jobs: {stderr}")

        except Exception as e:
            raise CommandError(f"Failed to remove cron jobs: {e}")

    def list_cron_jobs(self):
        """List current analytics cron jobs."""
        try:
            # Get current crontab
            try:
                current_crontab = subprocess.check_output(
                    ["crontab", "-l"], stderr=subprocess.DEVNULL
                ).decode("utf-8")
            except subprocess.CalledProcessError:
                self.stdout.write("No existing crontab found.")
                return

            # Extract analytics jobs
            analytics_marker = "# Analytics refresh jobs"
            end_marker = "# End analytics refresh jobs"

            if analytics_marker not in current_crontab:
                self.stdout.write("No analytics cron jobs configured.")
                return

            lines = current_crontab.split("\n")
            in_analytics_section = False
            analytics_jobs = []

            for line in lines:
                if line.strip() == analytics_marker:
                    in_analytics_section = True
                    continue
                elif line.strip() == end_marker:
                    in_analytics_section = False
                    continue
                elif in_analytics_section and line.strip():
                    analytics_jobs.append(line)

            if analytics_jobs:
                self.stdout.write("Current analytics cron jobs:")
                for i, job in enumerate(analytics_jobs, 1):
                    self.stdout.write(f"  {i}. {job}")
            else:
                self.stdout.write("No analytics cron jobs found.")

        except Exception as e:
            raise CommandError(f"Failed to list cron jobs: {e}")
