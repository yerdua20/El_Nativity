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

export async function listerMouvements(url = '/mouvements-stock/') {
  const { data } = await apiClient.get(url)
  return data
}

export async function listerEncaissements(url = '/encaissements/') {
  const { data } = await apiClient.get(url)
  return data
}
