import apiClient from './client'

export async function listerClients() {
  const { data } = await apiClient.get('/clients/')
  return data.results
}

export async function creerClient(payload) {
  const { data } = await apiClient.post('/clients/', payload)
  return data
}

export async function listerCommerciaux() {
  const { data } = await apiClient.get('/commerciaux/')
  return data.results
}

export async function listerProduits() {
  const { data } = await apiClient.get('/produits/')
  return data.results
}

export async function listerPointsDeVente() {
  const { data } = await apiClient.get('/points-de-vente/')
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
