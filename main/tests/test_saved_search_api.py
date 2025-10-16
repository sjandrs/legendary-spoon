from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from main.models import Account, Contact
from main.search_models import SavedSearch


class SavedSearchAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="tester", password="pass1234")
        # Use APIClient explicitly for type clarity
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Seed minimal data
        self.account = Account.objects.create(name="Acme Corp", owner=self.user)
        self.contact = Contact.objects.create(
            account=self.account,
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            owner=self.user,
        )

    def test_create_and_list_saved_search(self):
        url = "/api/saved-searches/"
        data = {
            "name": "My Contacts",
            "description": "Contacts with email",
            "search_type": "contacts",
            "search_query": "john",
            "filters": {"email": "example.com"},
            "sort_by": "created_at",
            "sort_order": "desc",
            "is_public": False,
        }
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)

        # List should include our saved search
        list_resp = self.client.get(url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        list_data = list_resp.json()
        self.assertTrue(any(ss.get("name") == "My Contacts" for ss in list_data))

    def test_execute_saved_search(self):
        # Create a saved search first
        saved = SavedSearch.objects.create(
            name="Find John",
            description="",
            user=self.user,
            search_type="contacts",
            search_query="john",
            filters={"email": "john.doe@example.com"},
            sort_by="created_at",
            sort_order="desc",
            is_public=False,
        )
        exec_url = f"/api/saved-searches/{saved.pk}/execute/"
        resp = self.client.post(exec_url, {"offset": 0, "limit": 10}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.content)
        data = resp.json()
        self.assertIn("results", data)
        # contacts advanced search returns a flat list of dicts
        results = data["results"]
        self.assertIsInstance(results, list)
        # Should at least find our seeded contact
        self.assertTrue(any("id" in r for r in results))

    def test_search_suggestions_endpoint(self):
        url = "/api/search/suggestions/?q=jo&type=contacts"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.content)
        data = resp.json()
        self.assertIn("suggestions", data)
        self.assertIsInstance(data["suggestions"], list)
