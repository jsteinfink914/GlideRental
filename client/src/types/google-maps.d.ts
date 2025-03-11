// Type definitions for Google Maps JavaScript API
declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
    getBounds(): LatLngBounds;
    getCenter(): LatLng;
    getDiv(): Element;
    getHeading(): number;
    getMapTypeId(): MapTypeId;
    getProjection(): Projection;
    getStreetView(): StreetViewPanorama;
    getTilt(): number;
    getZoom(): number;
    panBy(x: number, y: number): void;
    panTo(latLng: LatLng | LatLngLiteral): void;
    panToBounds(latLngBounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
    setCenter(latlng: LatLng | LatLngLiteral): void;
    setHeading(heading: number): void;
    setMapTypeId(mapTypeId: MapTypeId | string): void;
    setOptions(options: MapOptions): void;
    setStreetView(panorama: StreetViewPanorama): void;
    setTilt(tilt: number): void;
    setZoom(zoom: number): void;
    controls: MVCArray<Node>[];
    data: Data;
    mapTypes: MapTypeRegistry;
    overlayMapTypes: MVCArray<MapType>;
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    clickableIcons?: boolean;
    controlSize?: number;
    disableDefaultUI?: boolean;
    disableDoubleClickZoom?: boolean;
    draggable?: boolean;
    draggableCursor?: string;
    draggingCursor?: string;
    fullscreenControl?: boolean;
    fullscreenControlOptions?: FullscreenControlOptions;
    gestureHandling?: string;
    keyboardShortcuts?: boolean;
    mapTypeControl?: boolean;
    mapTypeControlOptions?: MapTypeControlOptions;
    mapTypeId?: MapTypeId;
    maxZoom?: number;
    minZoom?: number;
    noClear?: boolean;
    panControl?: boolean;
    panControlOptions?: PanControlOptions;
    rotateControl?: boolean;
    rotateControlOptions?: RotateControlOptions;
    scaleControl?: boolean;
    scaleControlOptions?: ScaleControlOptions;
    scrollwheel?: boolean;
    streetView?: StreetViewPanorama;
    streetViewControl?: boolean;
    streetViewControlOptions?: StreetViewControlOptions;
    styles?: MapTypeStyle[];
    tilt?: number;
    zoom?: number;
    zoomControl?: boolean;
    zoomControlOptions?: ZoomControlOptions;
  }

  interface FullscreenControlOptions {
    position?: ControlPosition;
  }

  interface MapTypeControlOptions {
    mapTypeIds?: (MapTypeId | string)[];
    position?: ControlPosition;
    style?: MapTypeControlStyle;
  }

  interface PanControlOptions {
    position?: ControlPosition;
  }

  interface RotateControlOptions {
    position?: ControlPosition;
  }

  interface ScaleControlOptions {
    style?: ScaleControlStyle;
  }

  interface StreetViewControlOptions {
    position?: ControlPosition;
  }

  interface ZoomControlOptions {
    position?: ControlPosition;
  }

  interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  enum MapTypeId {
    HYBRID,
    ROADMAP,
    SATELLITE,
    TERRAIN
  }

  enum ControlPosition {
    BOTTOM_CENTER,
    BOTTOM_LEFT,
    BOTTOM_RIGHT,
    LEFT_BOTTOM,
    LEFT_CENTER,
    LEFT_TOP,
    RIGHT_BOTTOM,
    RIGHT_CENTER,
    RIGHT_TOP,
    TOP_CENTER,
    TOP_LEFT,
    TOP_RIGHT
  }

  enum MapTypeControlStyle {
    DEFAULT,
    DROPDOWN_MENU,
    HORIZONTAL_BAR
  }

  enum ScaleControlStyle {
    DEFAULT
  }

  class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    equals(other: LatLng): boolean;
    lat(): number;
    lng(): number;
    toString(): string;
    toUrlValue(precision?: number): string;
    toJSON(): LatLngLiteral;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    contains(latLng: LatLng | LatLngLiteral): boolean;
    equals(other: LatLngBounds | LatLngBoundsLiteral): boolean;
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
    getCenter(): LatLng;
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
    intersects(other: LatLngBounds | LatLngBoundsLiteral): boolean;
    isEmpty(): boolean;
    toJSON(): LatLngBoundsLiteral;
    toSpan(): LatLng;
    toString(): string;
    toUrlValue(precision?: number): string;
    union(other: LatLngBounds | LatLngBoundsLiteral): LatLngBounds;
  }

  interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    getPosition(): LatLng | null;
    setTitle(title: string): void;
    getTitle(): string;
    setLabel(label: string | MarkerLabel): void;
    getLabel(): MarkerLabel;
    setDraggable(draggable: boolean): void;
    getDraggable(): boolean;
    setIcon(icon: string | Icon | Symbol): void;
    getIcon(): string | Icon | Symbol;
    setOpacity(opacity: number): void;
    getOpacity(): number;
    setVisible(visible: boolean): void;
    getVisible(): boolean;
    setZIndex(zIndex: number): void;
    getZIndex(): number;
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  interface MarkerOptions {
    anchorPoint?: Point;
    animation?: Animation;
    clickable?: boolean;
    crossOnDrag?: boolean;
    cursor?: string;
    draggable?: boolean;
    icon?: string | Icon | Symbol;
    label?: string | MarkerLabel;
    map?: Map | StreetViewPanorama;
    opacity?: number;
    optimized?: boolean;
    position?: LatLng | LatLngLiteral;
    shape?: MarkerShape;
    title?: string;
    visible?: boolean;
    zIndex?: number;
  }

  interface MarkerLabel {
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    text?: string;
  }

  interface Icon {
    anchor?: Point;
    labelOrigin?: Point;
    origin?: Point;
    scaledSize?: Size;
    size?: Size;
    url?: string;
  }

  interface MarkerShape {
    coords?: number[];
    type?: string;
  }

  enum Animation {
    BOUNCE = 1,
    DROP = 2
  }

  class InfoWindow {
    constructor(opts?: InfoWindowOptions);
    close(): void;
    getContent(): string | Element;
    getPosition(): LatLng;
    getZIndex(): number;
    open(map?: Map | StreetViewPanorama, anchor?: MVCObject): void;
    setContent(content: string | Element): void;
    setOptions(options: InfoWindowOptions): void;
    setPosition(position: LatLng | LatLngLiteral): void;
    setZIndex(zIndex: number): void;
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  interface InfoWindowOptions {
    ariaLabel?: string;
    content?: string | Element;
    disableAutoPan?: boolean;
    maxWidth?: number;
    minWidth?: number;
    pixelOffset?: Size;
    position?: LatLng | LatLngLiteral;
    zIndex?: number;
  }

  class DirectionsService {
    route(request: DirectionsRequest, callback: (result: DirectionsResult, status: DirectionsStatus) => void): void;
  }

  interface DirectionsRequest {
    avoidFerries?: boolean;
    avoidHighways?: boolean;
    avoidTolls?: boolean;
    destination?: LatLng | LatLngLiteral | string;
    drivingOptions?: DrivingOptions;
    optimizeWaypoints?: boolean;
    origin?: LatLng | LatLngLiteral | string;
    provideRouteAlternatives?: boolean;
    region?: string;
    transitOptions?: TransitOptions;
    travelMode?: TravelMode;
    unitSystem?: UnitSystem;
    waypoints?: DirectionsWaypoint[];
  }

  interface DrivingOptions {
    departureTime?: Date;
    trafficModel?: TrafficModel;
  }

  interface TransitOptions {
    arrivalTime?: Date;
    departureTime?: Date;
    modes?: TransitMode[];
    routingPreference?: TransitRoutePreference;
  }

  interface DirectionsWaypoint {
    location?: LatLng | LatLngLiteral | string;
    stopover?: boolean;
  }

  interface DirectionsResult {
    routes: DirectionsRoute[];
  }

  interface DirectionsRoute {
    bounds: LatLngBounds;
    copyrights: string;
    fare?: TransitFare;
    legs: DirectionsLeg[];
    overview_path: LatLng[];
    overview_polyline: string;
    warnings: string[];
    waypoint_order: number[];
  }

  interface DirectionsLeg {
    arrival_time?: Time;
    departure_time?: Time;
    distance: Distance;
    duration: Duration;
    duration_in_traffic?: Duration;
    end_address: string;
    end_location: LatLng;
    start_address: string;
    start_location: LatLng;
    steps: DirectionsStep[];
    via_waypoints: LatLng[];
  }

  interface DirectionsStep {
    distance: Distance;
    duration: Duration;
    end_location: LatLng;
    instructions: string;
    path: LatLng[];
    start_location: LatLng;
    steps?: DirectionsStep[];
    transit?: TransitDetails;
    travel_mode: TravelMode;
  }

  interface Distance {
    text: string;
    value: number;
  }

  interface Duration {
    text: string;
    value: number;
  }

  interface Time {
    text: string;
    time_zone: string;
    value: Date;
  }

  interface TransitDetails {
    arrival_stop: TransitStop;
    arrival_time: Time;
    departure_stop: TransitStop;
    departure_time: Time;
    headsign: string;
    headway: number;
    line: TransitLine;
    num_stops: number;
  }

  interface TransitStop {
    location: LatLng;
    name: string;
  }

  interface TransitLine {
    agencies: TransitAgency[];
    color: string;
    icon: string;
    name: string;
    short_name: string;
    text_color: string;
    url: string;
    vehicle: TransitVehicle;
  }

  interface TransitAgency {
    name: string;
    phone: string;
    url: string;
  }

  interface TransitVehicle {
    icon: string;
    local_icon: string;
    name: string;
    type: VehicleType;
  }

  interface TransitFare {
    currency: string;
    value: number;
  }

  enum TravelMode {
    BICYCLING = "BICYCLING",
    DRIVING = "DRIVING",
    TRANSIT = "TRANSIT",
    WALKING = "WALKING"
  }

  enum UnitSystem {
    IMPERIAL = 0,
    METRIC = 1
  }

  enum VehicleType {
    BUS = "BUS",
    CABLE_CAR = "CABLE_CAR",
    COMMUTER_TRAIN = "COMMUTER_TRAIN",
    FERRY = "FERRY",
    FUNICULAR = "FUNICULAR",
    GONDOLA_LIFT = "GONDOLA_LIFT",
    HEAVY_RAIL = "HEAVY_RAIL",
    HIGH_SPEED_TRAIN = "HIGH_SPEED_TRAIN",
    INTERCITY_BUS = "INTERCITY_BUS",
    METRO_RAIL = "METRO_RAIL",
    MONORAIL = "MONORAIL",
    OTHER = "OTHER",
    RAIL = "RAIL",
    SHARE_TAXI = "SHARE_TAXI",
    SUBWAY = "SUBWAY",
    TRAM = "TRAM",
    TROLLEYBUS = "TROLLEYBUS"
  }

  enum DirectionsStatus {
    INVALID_REQUEST = "INVALID_REQUEST",
    MAX_WAYPOINTS_EXCEEDED = "MAX_WAYPOINTS_EXCEEDED",
    NOT_FOUND = "NOT_FOUND",
    OK = "OK",
    OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
    REQUEST_DENIED = "REQUEST_DENIED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    ZERO_RESULTS = "ZERO_RESULTS"
  }

  enum TrafficModel {
    BEST_GUESS = "bestguess",
    OPTIMISTIC = "optimistic",
    PESSIMISTIC = "pessimistic"
  }

  enum TransitMode {
    BUS = "BUS",
    RAIL = "RAIL",
    SUBWAY = "SUBWAY",
    TRAIN = "TRAIN",
    TRAM = "TRAM"
  }

  enum TransitRoutePreference {
    FEWER_TRANSFERS = "FEWER_TRANSFERS",
    LESS_WALKING = "LESS_WALKING"
  }

  class DirectionsRenderer {
    constructor(opts?: DirectionsRendererOptions);
    getDirections(): DirectionsResult;
    getMap(): Map;
    getPanel(): Element;
    getRouteIndex(): number;
    setDirections(directions: DirectionsResult): void;
    setMap(map: Map | null): void;
    setOptions(options: DirectionsRendererOptions): void;
    setPanel(panel: Element): void;
    setRouteIndex(routeIndex: number): void;
  }

  interface DirectionsRendererOptions {
    directions?: DirectionsResult;
    draggable?: boolean;
    hideRouteList?: boolean;
    infoWindow?: InfoWindow;
    map?: Map;
    markerOptions?: MarkerOptions;
    panel?: Element;
    polylineOptions?: PolylineOptions;
    preserveViewport?: boolean;
    routeIndex?: number;
    suppressBicyclingLayer?: boolean;
    suppressInfoWindows?: boolean;
    suppressMarkers?: boolean;
    suppressPolylines?: boolean;
  }

  interface MapsEventListener {
    remove(): void;
  }

  interface Point {
    x: number;
    y: number;
    equals(other: Point): boolean;
    toString(): string;
  }

  interface Size {
    height: number;
    width: number;
    equals(other: Size): boolean;
    toString(): string;
  }

  interface PolylineOptions {
    clickable?: boolean;
    draggable?: boolean;
    editable?: boolean;
    geodesic?: boolean;
    icons?: IconSequence[];
    map?: Map;
    path?: LatLng[] | LatLngLiteral[] | MVCArray<LatLng>;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    visible?: boolean;
    zIndex?: number;
  }

  interface IconSequence {
    fixedRotation?: boolean;
    icon?: Symbol;
    offset?: string;
    repeat?: string;
  }

  interface Symbol {
    anchor?: Point;
    fillColor?: string;
    fillOpacity?: number;
    path?: SymbolPath | string;
    rotation?: number;
    scale?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }

  enum SymbolPath {
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4,
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2
  }

  interface MVCArray<T> {
    clear(): void;
    forEach(callback: (elem: T, i: number) => void): void;
    getArray(): T[];
    getAt(i: number): T;
    getLength(): number;
    insertAt(i: number, elem: T): void;
    pop(): T;
    push(elem: T): number;
    removeAt(i: number): T;
    setAt(i: number, elem: T): void;
  }

  interface MVCObject {
    addListener(eventName: string, handler: Function): MapsEventListener;
    bindTo(key: string, target: MVCObject, targetKey?: string, noNotify?: boolean): void;
    changed(key: string): void;
    get(key: string): any;
    notify(key: string): void;
    set(key: string, value: any): void;
    setValues(values: any): void;
    unbind(key: string): void;
    unbindAll(): void;
  }

  interface MapTypeRegistry extends MVCObject {
    set(id: string, mapType: MapType): void;
  }

  interface MapType {
    getTile(tileCoord: Point, zoom: number, ownerDocument: Document): Element;
    releaseTile(tile: Element): void;
    alt?: string;
    maxZoom?: number;
    minZoom?: number;
    name?: string;
    projection?: Projection;
    radius?: number;
    tileSize?: Size;
  }

  interface MapTypeStyle {
    elementType?: MapTypeStyleElementType;
    featureType?: MapTypeStyleFeatureType;
    stylers?: MapTypeStyler[];
  }

  type MapTypeStyleFeatureType = 'all' | 'administrative' | 'administrative.country' | 'administrative.land_parcel' | 'administrative.locality' | 'administrative.neighborhood' | 'administrative.province' | 'landscape' | 'landscape.man_made' | 'landscape.natural' | 'landscape.natural.landcover' | 'landscape.natural.terrain' | 'poi' | 'poi.attraction' | 'poi.business' | 'poi.government' | 'poi.medical' | 'poi.park' | 'poi.place_of_worship' | 'poi.school' | 'poi.sports_complex' | 'road' | 'road.arterial' | 'road.highway' | 'road.highway.controlled_access' | 'road.local' | 'transit' | 'transit.line' | 'transit.station' | 'transit.station.airport' | 'transit.station.bus' | 'transit.station.rail' | 'water';

  type MapTypeStyleElementType = 'all' | 'geometry' | 'geometry.fill' | 'geometry.stroke' | 'labels' | 'labels.icon' | 'labels.text' | 'labels.text.fill' | 'labels.text.stroke';

  interface MapTypeStyler {
    color?: string;
    gamma?: number;
    hue?: string;
    invert_lightness?: boolean;
    lightness?: number;
    saturation?: number;
    visibility?: string;
    weight?: number;
  }

  interface Projection {
    fromLatLngToPoint(latLng: LatLng, point?: Point): Point;
    fromPointToLatLng(pixel: Point, noWrap?: boolean): LatLng;
  }

  interface StreetViewPanorama extends MVCObject {
    constructor(container: Element, opts?: StreetViewPanoramaOptions);
    controls: MVCArray<Node>[];
    getLinks(): StreetViewLink[];
    getLocation(): StreetViewLocation;
    getMotionTracking(): boolean;
    getPano(): string;
    getPhotographerPov(): StreetViewPov;
    getPosition(): LatLng;
    getPov(): StreetViewPov;
    getStatus(): StreetViewStatus;
    getVisible(): boolean;
    getZoom(): number;
    registerPanoProvider(provider: (pano: string) => StreetViewPanoramaData): void;
    setLinks(links: StreetViewLink[]): void;
    setMotionTracking(motionTracking: boolean): void;
    setOptions(options: StreetViewPanoramaOptions): void;
    setPano(pano: string): void;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    setPov(pov: StreetViewPov): void;
    setVisible(flag: boolean): void;
    setZoom(zoom: number): void;
  }

  interface StreetViewPanoramaOptions {
    addressControl?: boolean;
    addressControlOptions?: StreetViewAddressControlOptions;
    clickToGo?: boolean;
    disableDefaultUI?: boolean;
    disableDoubleClickZoom?: boolean;
    enableCloseButton?: boolean;
    fullscreenControl?: boolean;
    fullscreenControlOptions?: FullscreenControlOptions;
    imageDateControl?: boolean;
    linksControl?: boolean;
    motionTracking?: boolean;
    motionTrackingControl?: boolean;
    motionTrackingControlOptions?: MotionTrackingControlOptions;
    panControl?: boolean;
    panControlOptions?: PanControlOptions;
    pano?: string;
    panoProvider?: (pano: string) => StreetViewPanoramaData;
    position?: LatLng | LatLngLiteral;
    pov?: StreetViewPov;
    scrollwheel?: boolean;
    showRoadLabels?: boolean;
    visible?: boolean;
    zoom?: number;
    zoomControl?: boolean;
    zoomControlOptions?: ZoomControlOptions;
  }

  interface StreetViewAddressControlOptions {
    position?: ControlPosition;
  }

  interface StreetViewPov {
    heading?: number;
    pitch?: number;
    zoom?: number;
  }

  interface StreetViewPanoramaData {
    copyright?: string;
    imageDate?: string;
    links?: StreetViewLink[];
    location?: StreetViewLocation;
    tiles?: StreetViewTileData;
  }

  interface StreetViewTileData {
    centerHeading?: number;
    tileSize?: Size;
    worldSize?: Size;
    getTileUrl(pano: string, tileZoom: number, tileX: number, tileY: number): string;
  }

  interface StreetViewLink {
    description?: string;
    heading?: number;
    pano?: string;
  }

  interface StreetViewLocation {
    description?: string;
    latLng?: LatLng;
    pano?: string;
    shortDescription?: string;
  }

  enum StreetViewStatus {
    UNKNOWN_ERROR,
    ZERO_RESULTS,
    OK
  }

  interface MotionTrackingControlOptions {
    position?: ControlPosition;
  }

  class Event {
    stop(): void;
    latLng: LatLng;
    domEvent: Event;
  }

  class Data extends MVCObject {
    constructor(options?: Data.DataOptions);
    add(feature: Data.Feature | Data.FeatureOptions): Data.Feature;
    addGeoJson(geoJson: object, options?: Data.GeoJsonOptions): Data.Feature[];
    contains(feature: Data.Feature): boolean;
    forEach(callback: (feature: Data.Feature) => void): void;
    getControlPosition(): ControlPosition;
    getControls(): string[];
    getDrawingMode(): string;
    getFeatureById(id: number | string): Data.Feature;
    getMap(): Map;
    getStyle(): Data.StylingFunction | Data.StyleOptions;
    loadGeoJson(url: string, options?: Data.GeoJsonOptions, callback?: (features: Data.Feature[]) => void): void;
    overrideStyle(feature: Data.Feature, style: Data.StyleOptions): void;
    remove(feature: Data.Feature): void;
    revertStyle(feature?: Data.Feature): void;
    setControlPosition(controlPosition: ControlPosition): void;
    setControls(controls: string[]): void;
    setDrawingMode(drawingMode: string): void;
    setMap(map: Map | null): void;
    setStyle(style: Data.StylingFunction | Data.StyleOptions): void;
    toGeoJson(callback: (feature: object) => void): void;
    addListener(eventName: string, handler: (event: Data.MouseEvent | Data.AddFeatureEvent | Data.RemoveFeatureEvent | Data.SetGeometryEvent | Data.SetPropertyEvent) => void): MapsEventListener;
  }

  namespace Data {
    interface DataOptions {
      controlPosition?: ControlPosition;
      controls?: string[];
      drawingMode?: string;
      featureFactory?: (geometry: Geometry) => Feature;
      map?: Map;
      style?: StylingFunction | StyleOptions;
    }

    interface GeoJsonOptions {
      idPropertyName?: string;
    }

    interface StyleOptions {
      clickable?: boolean;
      cursor?: string;
      draggable?: boolean;
      editable?: boolean;
      fillColor?: string;
      fillOpacity?: number;
      icon?: string | Icon | Symbol;
      shape?: MarkerShape;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      title?: string;
      visible?: boolean;
      zIndex?: number;
    }

    type StylingFunction = (feature: Feature) => StyleOptions;

    class Feature {
      constructor(options?: FeatureOptions);
      forEachProperty(callback: (value: any, name: string) => void): void;
      getGeometry(): Geometry;
      getId(): number | string;
      getProperty(name: string): any;
      removeProperty(name: string): void;
      setGeometry(newGeometry: Geometry | LatLng | LatLngLiteral): void;
      setProperty(name: string, newValue: any): void;
      toGeoJson(callback: (feature: object) => void): void;
    }

    interface FeatureOptions {
      geometry?: Geometry | LatLng | LatLngLiteral;
      id?: number | string;
      properties?: object;
    }

    class Geometry {
      getType(): string;
      forEachLatLng(callback: (latLng: LatLng) => void): void;
    }

    class Point extends Geometry {
      constructor(latLng: LatLng | LatLngLiteral);
      get(): LatLng;
    }

    class MultiPoint extends Geometry {
      constructor(elements: (LatLng | LatLngLiteral)[]);
      getArray(): LatLng[];
      getAt(n: number): LatLng;
      getLength(): number;
    }

    class LineString extends Geometry {
      constructor(elements: (LatLng | LatLngLiteral)[]);
      getArray(): LatLng[];
      getAt(n: number): LatLng;
      getLength(): number;
    }

    class MultiLineString extends Geometry {
      constructor(elements: (LatLng | LatLngLiteral)[][]);
      getArray(): LineString[];
      getAt(n: number): LineString;
      getLength(): number;
    }

    class LinearRing extends Geometry {
      constructor(elements: (LatLng | LatLngLiteral)[]);
      getArray(): LatLng[];
      getAt(n: number): LatLng;
      getLength(): number;
    }

    class Polygon extends Geometry {
      constructor(elements: (LatLng | LatLngLiteral)[][]);
      getArray(): LinearRing[];
      getAt(n: number): LinearRing;
      getLength(): number;
    }

    class MultiPolygon extends Geometry {
      constructor(elements: (LatLng | LatLngLiteral)[][][]);
      getArray(): Polygon[];
      getAt(n: number): Polygon;
      getLength(): number;
    }

    class GeometryCollection extends Geometry {
      constructor(elements: Geometry[]);
      getArray(): Geometry[];
      getAt(n: number): Geometry;
      getLength(): number;
    }

    interface MouseEvent extends Event {
      feature: Feature;
    }

    interface AddFeatureEvent {
      feature: Feature;
    }

    interface RemoveFeatureEvent {
      feature: Feature;
    }

    interface SetGeometryEvent {
      feature: Feature;
      newGeometry: Geometry;
      oldGeometry: Geometry;
    }

    interface SetPropertyEvent {
      feature: Feature;
      name: string;
      newValue: any;
      oldValue: any;
    }
  }
}

declare interface Window {
  google: typeof google;
  initMap: () => void;
}