import { Component } from 'react'

/**
 * Filet de sécurité générique : évite qu'une erreur de rendu dans une
 * bibliothèque tierce (ex. Leaflet) ne fasse planter toute l'application
 * (écran blanc) plutôt que juste la zone concernée.
 */
export default class ErrorBoundary extends Component {
  state = { aPlante: false }

  static getDerivedStateFromError() {
    return { aPlante: true }
  }

  componentDidCatch(erreur, info) {
    console.error('Erreur capturée par ErrorBoundary :', erreur, info)
  }

  render() {
    if (this.state.aPlante) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
