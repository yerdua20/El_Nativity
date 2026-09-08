import apiClient from './client'

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

export async function creerMouvement(payload) {
  const { data } = await apiClient.post('/mouvements-stock/', payload)
  return data
}
