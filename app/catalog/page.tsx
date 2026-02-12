// VERSIÓN MODAL ACTIVA - Para volver a la versión anterior,
// descomenta la línea de abajo y comenta la de CatalogViewWithModal
// import CatalogView from '@/src/views/catalog/ui/CatalogView';
import CatalogViewWithModal from '@/src/views/catalog/ui/CatalogViewWithModal';

export default function CatalogPage() {
    // return <CatalogView />; // Versión página completa
    return <CatalogViewWithModal />; // Versión modal libro
}
