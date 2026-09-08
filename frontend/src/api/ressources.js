import apiClient from './client'

export async function listerClients() {
  const { data } = await apiClient.get('/clients/')
  return data.results
}

export async function listerCommerciaux() {
  const { data } = await apiClient.get('/commerciaux/')
  return data.results
}

export async function creerEncaissement(payload) {
  const { data } = await apiClient.post('/encaissements/', payload)
  return data
}
