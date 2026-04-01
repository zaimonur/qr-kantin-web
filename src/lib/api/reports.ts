/**
 * @file reports.ts
 * @description Raporlama işlemlerini yürüten API servisleri.
 * @author Onur Zaim
 * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
 */

const API_URL = "http://localhost:1323";

export async function getDashboardReports() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/admin/reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Rapor istatistikleri alınamadı");
  }

  return response.json();
}

export async function getOrderHistory() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/admin/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Sipariş geçmişi alınamadı");
  }

  return response.json();
}

function getHeaders() {
	const token = localStorage.getItem('token');
	return {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
	};
}

export async function getSalesReport(startDate?: string, endDate?: string) {
	// Tarihler gelirse URL'e query olarak ekle
	let url = `${API_URL}/admin/reports/sales`;
	if (startDate && endDate) {
		url += `?start_date=${startDate}&end_date=${endDate}`;
	}

	const response = await fetch(url, {
		method: 'GET',
		headers: getHeaders()
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Satış raporu getirilemedi');
	}

	return await response.json();
}

export async function getDetailedOrders(startDate?: string, endDate?: string) {
	let url = `${API_URL}/admin/reports/detailed-orders`;
	if (startDate && endDate) {
		url += `?start_date=${startDate}&end_date=${endDate}`;
	}

	const response = await fetch(url, {
		method: 'GET',
		headers: getHeaders()
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Detaylı siparişler getirilemedi');
	}

	return await response.json();
}