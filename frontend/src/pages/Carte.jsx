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

const iconeMarchand = new L.DivIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#f97316;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
})

const CENTRE_LOME = [6.1319, 1.2228]

export default function Carte() {
  const clients = useRessource(listerClients, 'cache_clients')

  const localises = useMemo(
    () => clients.filter((client) => client.latitude != null && client.longitude != null),
    [clients],
  )

  const centre = localises.length > 0
    ? [Number(localises[0].latitude), Number(localises[0].longitude)]
    : CENTRE_LOME

  return (
    <Layout>
      <EnTeteBandeau
        titre="Carte des clients et marchands"
        sousTitre="Localisation des clients et des points de dépôt-vente"
        icone={MapPin}
      />

      {localises.length === 0 && (
        <p className="mb-4 text-sm text-slate-500">
          Aucun client ni marchand ne dispose encore de coordonnées GPS. Elles sont capturées
          automatiquement lors d'un nouveau dépôt sur le terrain.
        </p>
      )}

      <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-orange-500" /> Marchand (dépôt-vente)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" /> Client (cash)
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200" style={{ height: '32rem' }}>
        <MapContainer center={centre} zoom={localises.length > 0 ? 12 : 11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {localises.map((client) => {
            const estMarchand = client.mode_vente === 'DEPOT_VENTE'
            return (
              <Marker
                key={client.id}
                position={[Number(client.latitude), Number(client.longitude)]}
                icon={estMarchand ? iconeMarchand : undefined}
              >
                <Popup>
                  <strong>{client.nom}</strong> ({estMarchand ? 'Marchand' : 'Client'})
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
                  {estMarchand && (
                    <>
                      <br />
                      Solde marchandise : {client.solde_marchandise}
                    </>
                  )}
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </Layout>
  )
}
