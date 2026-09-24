from django.core.management.base import BaseCommand
from django.db import transaction

from experience.management.demo import add_no_input_argument, confirm, flush


class Command(BaseCommand):
    help = "Delete all portfolio content (users are kept)."

    def add_arguments(self, parser):
        add_no_input_argument(parser)

    @transaction.atomic
    def handle(self, *args, interactive=True, **options):
        confirm(interactive, "delete")
        flush()
        self.stdout.write(self.style.SUCCESS("Portfolio content deleted."))
