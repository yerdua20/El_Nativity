import apiClient from './client'

export async function listerMouvements(url = '/mouvements-stock/') {
  const { data } = await apiClient.get(url)
  return data
}

export async function listerEncaissements(url = '/encaissements/') {
  const { data } = await apiClient.get(url)
  return data
}

export async function listerClients() {
  const { data } = await apiClient.get('/clients/')
  return data.results
}

export async function listerProduits() {
  const { data } = await apiClient.get('/produits/')
  return data.results
}
