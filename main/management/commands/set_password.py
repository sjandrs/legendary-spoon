import getpass

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Resets the password for a user."

    def add_arguments(self, parser):
        parser.add_argument(
            "username",
            type=str,
            help="The username of the user whose password to reset.",
        )

    def handle(self, *args, **kwargs):
        User = get_user_model()
        username = kwargs["username"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with username "{username}" does not exist.')
            )
            return

        self.stdout.write(f"Please enter a new password for {username}.")
        password = getpass.getpass()
        password_confirm = getpass.getpass("Confirm password: ")

        if password != password_confirm:
            self.stdout.write(self.style.ERROR("Passwords do not match. Aborting."))
            return

        if not password:
            self.stdout.write(self.style.ERROR("Password cannot be empty. Aborting."))
            return

        user.set_password(password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f'Successfully reset password for user "{username}".')
        )
