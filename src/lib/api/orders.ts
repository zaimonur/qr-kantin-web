/**
 * @file orders.ts
 * @description Sipariş işlemlerini yürüten API servisleri.
 * @author Onur Zaim
 * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
 */

const API_URL = 'http://localhost:1323';

function getHeaders() {
	const token = localStorage.getItem('token');
	return {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
	};
}

export async function getActiveOrders() {
	const response = await fetch(`${API_URL}/admin/orders`, {
		method: 'GET',
		headers: getHeaders()
	});
	if (!response.ok) throw new Error('Siparişler getirilemedi');
	return await response.json() || [];
}

// YENİ: Siparişi Onayla (Bakiyeyi/Stoğu Düş)
export async function approveOrder(id: string) {
	const response = await fetch(`${API_URL}/admin/orders/${id}/approve`, {
		method: 'PUT',
		headers: getHeaders()
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || 'Sipariş onaylanamadı');
	return data;
}

// YENİ: Siparişi Reddet (Parayı İade Et)
export async function rejectOrder(id: string) {
	const response = await fetch(`${API_URL}/admin/orders/${id}/reject`, {
		method: 'PUT',
		headers: getHeaders()
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || 'Sipariş iptal edilemedi');
	return data;
}

export async function markOrderReady(id: string) {
	const response = await fetch(`${API_URL}/admin/orders/${id}/ready`, {
		method: 'PUT',
		headers: getHeaders()
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || 'İşlem başarısız');
	return data;
}

export async function completeOrder(qrToken: string) {
	const response = await fetch(`${API_URL}/admin/orders/complete`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify({ qr_token: qrToken })
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || 'Teslimat başarısız');
	return data;
}