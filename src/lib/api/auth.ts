/**
 * @file auth.ts
 * @description Giriş işlemlerini yürüten API servisleri.
 * @author Onur Zaim
 * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
 */

import { API_URL } from '$lib/api/constants';

export async function loginUser(email: string, password: string) {
	try {
		const response = await fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password })
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Giriş başarısız');
		}

		// --- RBAC KONTROLÜ (Yetkilendirme)
		// Eğer giriş yapan kişi öğrenciyse, token'ı kaydetmeden direkt hata fırlat
		if (data.user.role !== 'admin') {
			throw new Error('Erişim Engellendi: Web paneline sadece yetkili personeller giriş yapabilir. Lütfen mobil uygulamayı kullanın.');
		}

		// Token ve kullanıcı bilgisini localStorage'a kaydediyoruz (Sistemin hafızası)
		localStorage.setItem('token', data.token);
		localStorage.setItem('user', JSON.stringify(data.user));

		return data;
	} catch (error: any) {
		throw new Error(error.message);
	}
}

export function logoutUser() {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
}

export async function registerUser(fullName: string, email: string, password: string, role: string) {
  const token = localStorage.getItem("token"); 

  // Role tabanlı yönlendirme: Kullanıcı rolüne göre ilgili endpoint'e yönlendirme yapılır.
  let endpoint = "";
  if (role === "admin") {
    endpoint = "/admin/register/admin";
  } else if (role === "ogretmen") {
    endpoint = "/admin/register/teacher";
  } else {
    endpoint = "/admin/register/student";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    },
    body: JSON.stringify({
      full_name: fullName,
      email: email,
      password: password,
      // Artık 'role' verisini backend'e yollamamıza gerek yok çünkü rotalar ayrıldı!
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Kullanıcı eklenirken bir hata oluştu");
  }

  return response.json();
}