from django.db.models import Q
from django.utils import timezone

from .models import JournalEntry, LedgerAccount


class FinancialReports:
    """Financial reporting utilities for Converge CRM"""

    @staticmethod
    def get_balance_sheet(as_of_date=None):
        """
        Generate balance sheet report
        Returns assets, liabilities, and equity as of the specified date
        """
        if as_of_date is None:
            as_of_date = timezone.now().date()

        # Get all journal entries up to the specified date
        entries = JournalEntry.objects.filter(date__lte=as_of_date)

        # Calculate account balances
        account_balances = {}
        for entry in entries:
            # Debit increases assets/expenses, credit increases liabilities/equity/revenue
            if entry.debit_account.account_type in ["asset", "expense"]:
                account_balances[entry.debit_account] = (
                    account_balances.get(entry.debit_account, 0) + entry.amount
                )
            else:
                account_balances[entry.debit_account] = (
                    account_balances.get(entry.debit_account, 0) - entry.amount
                )

            if entry.credit_account.account_type in ["liability", "equity", "revenue"]:
                account_balances[entry.credit_account] = (
                    account_balances.get(entry.credit_account, 0) + entry.amount
                )
            else:
                account_balances[entry.credit_account] = (
                    account_balances.get(entry.credit_account, 0) - entry.amount
                )

        # Organize by account type
        assets = {
            acc: bal
            for acc, bal in account_balances.items()
            if acc.account_type == "asset"
        }
        liabilities = {
            acc: bal
            for acc, bal in account_balances.items()
            if acc.account_type == "liability"
        }
        equity = {
            acc: bal
            for acc, bal in account_balances.items()
            if acc.account_type == "equity"
        }

        return {
            "as_of_date": as_of_date,
            "assets": assets,
            "liabilities": liabilities,
            "equity": equity,
            "total_assets": sum(assets.values()),
            "total_liabilities": sum(liabilities.values()),
            "total_equity": sum(equity.values()),
        }

    @staticmethod
    def get_profit_loss(start_date=None, end_date=None):
        """
        Generate profit and loss statement for the specified period
        """
        if start_date is None:
            # Default to current month
            today = timezone.now().date()
            start_date = today.replace(day=1)
        if end_date is None:
            end_date = timezone.now().date()

        # Get journal entries for the period
        entries = JournalEntry.objects.filter(date__range=[start_date, end_date])

        # Calculate revenue and expenses
        revenue_accounts = {}
        expense_accounts = {}

        for entry in entries:
            if entry.debit_account.account_type == "revenue":
                revenue_accounts[entry.debit_account] = (
                    revenue_accounts.get(entry.debit_account, 0) - entry.amount
                )
            elif entry.credit_account.account_type == "revenue":
                revenue_accounts[entry.credit_account] = (
                    revenue_accounts.get(entry.credit_account, 0) + entry.amount
                )

            if entry.debit_account.account_type == "expense":
                expense_accounts[entry.debit_account] = (
                    expense_accounts.get(entry.debit_account, 0) + entry.amount
                )
            elif entry.credit_account.account_type == "expense":
                expense_accounts[entry.credit_account] = (
                    expense_accounts.get(entry.credit_account, 0) - entry.amount
                )

        total_revenue = sum(revenue_accounts.values())
        total_expenses = sum(expense_accounts.values())
        net_profit = total_revenue - total_expenses

        return {
            "start_date": start_date,
            "end_date": end_date,
            "revenue": revenue_accounts,
            "expenses": expense_accounts,
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
        }

    @staticmethod
    def get_cash_flow(start_date=None, end_date=None):
        """
        Generate cash flow statement for the specified period
        """
        if start_date is None:
            today = timezone.now().date()
            start_date = today.replace(day=1)
        if end_date is None:
            end_date = timezone.now().date()

        # Get cash account (assuming there's a cash account with code '1000' or similar)
        try:
            cash_account = LedgerAccount.objects.get(
                code="1000"
            )  # Assuming cash account code
        except LedgerAccount.DoesNotExist:
            # Fallback: find any asset account that might represent cash
            cash_account = LedgerAccount.objects.filter(account_type="asset").first()
            if not cash_account:
                return {
                    "start_date": start_date,
                    "end_date": end_date,
                    "operating_activities": 0,
                    "investing_activities": 0,
                    "financing_activities": 0,
                    "net_cash_flow": 0,
                    "error": "No cash account found",
                }

        # Calculate cash flows from operations (simplified)
        # In a real implementation, this would be more complex
        cash_entries = JournalEntry.objects.filter(
            Q(debit_account=cash_account) | Q(credit_account=cash_account),
            date__range=[start_date, end_date],
        )

        operating_cash_flow = 0
        investing_cash_flow = 0
        financing_cash_flow = 0

        for entry in cash_entries:
            if entry.debit_account == cash_account:
                # Cash inflow
                if entry.credit_account.account_type in ["revenue", "expense"]:
                    operating_cash_flow += entry.amount
                elif entry.credit_account.account_type == "asset":
                    investing_cash_flow += entry.amount
                else:
                    financing_cash_flow += entry.amount
            else:
                # Cash outflow
                if entry.debit_account.account_type in ["revenue", "expense"]:
                    operating_cash_flow -= entry.amount
                elif entry.debit_account.account_type == "asset":
                    investing_cash_flow -= entry.amount
                else:
                    financing_cash_flow -= entry.amount

        net_cash_flow = operating_cash_flow + investing_cash_flow + financing_cash_flow

        return {
            "start_date": start_date,
            "end_date": end_date,
            "operating_activities": operating_cash_flow,
            "investing_activities": investing_cash_flow,
            "financing_activities": financing_cash_flow,
            "net_cash_flow": net_cash_flow,
        }
