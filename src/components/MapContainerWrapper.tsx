// MapContainerWrapper.jsx
import { forwardRef } from 'react';
import { MapContainer as LeafletMapContainer } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';

interface MapContainerWrapperProps {
  [key: string]: unknown; // Replace `any` with a more specific type if needed
}

const MapContainerWrapper = forwardRef<LeafletMap, MapContainerWrapperProps>(function MapContainerWrapper(props, ref) {
  return <LeafletMapContainer ref={ref} {...props} />;
});

export default MapContainerWrapper;
