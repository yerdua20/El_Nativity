import apiClient from './client'

export async function listerClients() {
  const { data } = await apiClient.get('/clients/')
  return data.results
}

export async function creerClient(payload) {
  const { data } = await apiClient.post('/clients/', payload)
  return data
}

export async function lireClient(id) {
  const { data } = await apiClient.get(`/clients/${id}/`)
  return data
}

export async function listerCommerciaux() {
  const { data } = await apiClient.get('/commerciaux/')
  return data.results
}

export async function creerCommercial(payload) {
  const { data } = await apiClient.post('/commerciaux/', payload)
  return data
}

export async function marquerCommercialParti(id) {
  const { data } = await apiClient.patch(`/commerciaux/${id}/`, {
    actif: false,
    date_sortie: new Date().toISOString().slice(0, 10),
  })
  return data
}

export async function listerProduits() {
  const { data } = await apiClient.get('/produits/')
  return data.results
}

export async function creerProduit(payload) {
  const { data } = await apiClient.post('/produits/', payload)
  return data
}

export async function listerPointsDeVente() {
  const { data } = await apiClient.get('/points-de-vente/')
  return data.results
}

export async function creerPointDeVente(payload) {
  const { data } = await apiClient.post('/points-de-vente/', payload)
  return data
}

export async function listerTarifs() {
  const { data } = await apiClient.get('/tarifs/')
  return data.results
}

export async function creerTarif(payload) {
  const { data } = await apiClient.post('/tarifs/', payload)
  return data
}

export async function listerStockPointsDeVente(pointDeVenteId) {
  const { data } = await apiClient.get('/stock-points-de-vente/', {
    params: pointDeVenteId ? { point_de_vente: pointDeVenteId } : undefined,
  })
  return data.results
}

export async function listerMouvements(url = '/mouvements-stock/') {
  const { data } = await apiClient.get(url)
  return data
}

export async function listerEncaissements(url = '/encaissements/') {
  const { data } = await apiClient.get(url)
  return data
}

export async function lireMoi() {
  const { data } = await apiClient.get('/auth/moi/')
  return data
}

export async function modifierMoi(payload) {
  const { data } = await apiClient.patch('/auth/moi/', payload)
  return data
}

export async function changerMotDePasse(payload) {
  const { data } = await apiClient.post('/auth/changer-mot-de-passe/', payload)
  return data
}

export async function lireEntreprise() {
  const { data } = await apiClient.get('/entreprise/')
  return data
}

export async function modifierEntreprise(payload) {
  const { data } = await apiClient.patch('/entreprise/', payload)
  return data
}

export async function listerUtilisateurs() {
  const { data } = await apiClient.get('/utilisateurs/')
  return data.results
}

export async function creerUtilisateur(payload) {
  const { data } = await apiClient.post('/utilisateurs/', payload)
  return data
}

export async function modifierUtilisateur(id, payload) {
  const { data } = await apiClient.patch(`/utilisateurs/${id}/`, payload)
  return data
}

export async function supprimerUtilisateur(id) {
  await apiClient.delete(`/utilisateurs/${id}/`)
}

export async function listerReservations() {
  const { data } = await apiClient.get('/reservations/')
  return data.results
}

export async function creerReservation(payload) {
  const { data } = await apiClient.post('/reservations/', payload)
  return data
}

export async function modifierReservation(id, payload) {
  const { data } = await apiClient.patch(`/reservations/${id}/`, payload)
  return data
}

export async function exporterCSV(jeu) {
  const response = await apiClient.get('/export/', { params: { jeu }, responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `${jeu}.csv`
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  window.URL.revokeObjectURL(url)
}
