import { MapPin } from 'lucide-react'
import { useMemo } from 'react'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { listerClients } from '../api/ressources'
import EnTeteBandeau from '../components/EnTeteBandeau'
import Layout from '../components/Layout'
import { useRessource } from '../hooks/useRessource'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const CENTRE_LOME = [6.1319, 1.2228]

export default function Carte() {
  const clients = useRessource(listerClients, 'cache_clients')

  const clientsLocalises = useMemo(
    () => clients.filter((client) => client.latitude != null && client.longitude != null),
    [clients],
  )

  const centre = clientsLocalises.length > 0
    ? [Number(clientsLocalises[0].latitude), Number(clientsLocalises[0].longitude)]
    : CENTRE_LOME

  return (
    <Layout>
      <EnTeteBandeau
        titre="Carte des clients"
        sousTitre="Localisation des boutiques de vos clients"
        icone={MapPin}
      />

      {clientsLocalises.length === 0 && (
        <p className="mb-4 text-sm text-slate-500">
          Aucun client ne dispose encore de coordonnées GPS. Elles sont capturées automatiquement
          lors d'un nouveau dépôt sur le terrain.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200" style={{ height: '32rem' }}>
        <MapContainer center={centre} zoom={clientsLocalises.length > 0 ? 12 : 11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {clientsLocalises.map((client) => (
            <Marker key={client.id} position={[Number(client.latitude), Number(client.longitude)]}>
              <Popup>
                <strong>{client.nom}</strong>
                {client.adresse && (
                  <>
                    <br />
                    {client.adresse}
                  </>
                )}
                {client.telephone && (
                  <>
                    <br />
                    {client.telephone}
                  </>
                )}
                <br />
                Solde marchandise : {client.solde_marchandise}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Layout>
  )
}
