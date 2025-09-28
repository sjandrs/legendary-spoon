from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
import time

class AuthTests(TestCase):
	def setUp(self):
		self.client = Client()
		self.user_model = get_user_model()
		self.user = self.user_model.objects.create_user(username='testuser', password='testpass')

	def test_registration(self):
		response = self.client.post(reverse('register'), {
			'username': 'newuser',
			'password1': 'newpass123',
			'password2': 'newpass123',
		})
		self.assertEqual(response.status_code, 302)  # Redirect to login
		self.assertTrue(self.user_model.objects.filter(username='newuser').exists())

	def test_login_logout(self):
		login = self.client.login(username='testuser', password='testpass')
		self.assertTrue(login)
		response = self.client.get(reverse('home'))
		self.assertEqual(response.status_code, 200)
		self.client.logout()
		response = self.client.get(reverse('home'))
		self.assertEqual(response.status_code, 302)  # Redirect to login

	def test_session_expiry(self):
		self.client.login(username='testuser', password='testpass')
		session = self.client.session
		session.set_expiry(2)  # 2 seconds
		session.save()
		time.sleep(3)
		response = self.client.get(reverse('home'))
		self.assertEqual(response.status_code, 302)  # Should be logged out
