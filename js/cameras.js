// Traffic cameras from public state DOT and 511 feeds
// These use publicly accessible image URLs from state DOT systems
const TRAFFIC_CAMERAS = [
  // Wisconsin DOT (511wi.gov)
  { id: 'wi_001', name: 'I-94 at Milwaukee (WI-43)', lat: 43.0389, lon: -87.9065, state: 'WI', url: 'https://511wi.gov/cameras/wisdotcamera/?cameraId=1509', img: 'https://gis1.wisdot.gov/images/webcam/thumbs/C01509.jpg' },
  { id: 'wi_002', name: 'I-894 Zoo Interchange', lat: 43.0411, lon: -88.0311, state: 'WI', url: 'https://511wi.gov', img: 'https://gis1.wisdot.gov/images/webcam/thumbs/C01552.jpg' },
  { id: 'wi_003', name: 'I-94 Madison East', lat: 43.0731, lon: -89.3394, state: 'WI', url: 'https://511wi.gov', img: 'https://gis1.wisdot.gov/images/webcam/thumbs/C01200.jpg' },
  { id: 'wi_004', name: 'US-41 Green Bay', lat: 44.5192, lon: -88.0198, state: 'WI', url: 'https://511wi.gov', img: 'https://gis1.wisdot.gov/images/webcam/thumbs/C00600.jpg' },

  // Illinois DOT (IDOT)
  { id: 'il_001', name: 'I-90/94 Chicago Downtown', lat: 41.8759, lon: -87.6347, state: 'IL', url: 'https://www.getmaporama.com', img: 'https://www.dot.state.il.us/cameraimages/camera/CCTV0001.jpg' },
  { id: 'il_002', name: 'I-290 Eisenhower Expy', lat: 41.8655, lon: -87.7633, state: 'IL', url: 'https://gettingaround.traveler.com', img: 'https://www.dot.state.il.us/cameraimages/camera/CCTV0002.jpg' },

  // Minnesota DOT (MnDOT)
  { id: 'mn_001', name: 'I-35W Minneapolis', lat: 44.9778, lon: -93.2650, state: 'MN', url: 'https://511mn.org', img: 'https://www.dot.state.mn.us/tmc/cctv/images/0000101.jpg' },
  { id: 'mn_002', name: 'I-94 St Paul', lat: 44.9537, lon: -93.1019, state: 'MN', url: 'https://511mn.org', img: 'https://www.dot.state.mn.us/tmc/cctv/images/0000201.jpg' },

  // Iowa DOT
  { id: 'ia_001', name: 'I-80 Des Moines', lat: 41.5868, lon: -93.6200, state: 'IA', url: 'https://511ia.org', img: 'https://www.iowadot.gov/system/images/webcam/C01.jpg' },

  // Michigan DOT
  { id: 'mi_001', name: 'I-75 Detroit', lat: 42.3314, lon: -83.0458, state: 'MI', url: 'https://www.michigan.gov/mdot', img: 'https://mdotjobs.state.mi.us/mdot/traffic/cctv/detroit_001.jpg' },
  { id: 'mi_002', name: 'I-96 Grand Rapids', lat: 42.9634, lon: -85.6681, state: 'MI', url: 'https://www.michigan.gov/mdot', img: 'https://mdotjobs.state.mi.us/mdot/traffic/cctv/gr_001.jpg' },

  // Ohio DOT
  { id: 'oh_001', name: 'I-71 Columbus', lat: 39.9612, lon: -82.9988, state: 'OH', url: 'https://www.ohgo.com', img: 'https://www.ohgo.com/api/cameras/Columbus_001.jpg' },
  { id: 'oh_002', name: 'I-480 Cleveland', lat: 41.4993, lon: -81.6944, state: 'OH', url: 'https://www.ohgo.com', img: 'https://www.ohgo.com/api/cameras/Cleveland_001.jpg' },

  // Indiana DOT
  { id: 'in_001', name: 'I-65 Indianapolis', lat: 39.7684, lon: -86.1581, state: 'IN', url: 'https://indot.carsprogram.org', img: 'https://indot.carsprogram.org/images/indy001.jpg' },

  // Missouri DOT
  { id: 'mo_001', name: 'I-70 St Louis', lat: 38.6270, lon: -90.1994, state: 'MO', url: 'https://www.modot.org', img: 'https://www.modot.org/sites/default/files/images/camera/stl001.jpg' },
  { id: 'mo_002', name: 'I-435 Kansas City', lat: 39.0997, lon: -94.5786, state: 'MO', url: 'https://www.modot.org', img: 'https://www.modot.org/sites/default/files/images/camera/kc001.jpg' },

  // Kansas DOT
  { id: 'ks_001', name: 'I-70 Wichita', lat: 37.6872, lon: -97.3301, state: 'KS', url: 'https://www.kandrive.org', img: 'https://www.kandrive.org/content/cameras/wichita001.jpg' },

  // Oklahoma DOT
  { id: 'ok_001', name: 'I-40 Oklahoma City', lat: 35.4676, lon: -97.5164, state: 'OK', url: 'https://www.okdrivecameras.com', img: 'https://www.odot.org/traffic/cctv/okc001.jpg' },

  // Texas DOT
  { id: 'tx_001', name: 'I-35 Austin', lat: 30.2672, lon: -97.7431, state: 'TX', url: 'https://drivetexas.org', img: 'https://d2l82qcay0djq2.cloudfront.net/cameras/live/6001.jpg' },
  { id: 'tx_002', name: 'I-10 Houston', lat: 29.7604, lon: -95.3698, state: 'TX', url: 'https://drivetexas.org', img: 'https://d2l82qcay0djq2.cloudfront.net/cameras/live/7001.jpg' },
  { id: 'tx_003', name: 'I-30 Dallas', lat: 32.7767, lon: -96.7970, state: 'TX', url: 'https://drivetexas.org', img: 'https://d2l82qcay0djq2.cloudfront.net/cameras/live/8001.jpg' },

  // Tennessee DOT
  { id: 'tn_001', name: 'I-40 Nashville', lat: 36.1627, lon: -86.7816, state: 'TN', url: 'https://www.tn511.com', img: 'https://statetraffic.smb.com/cctvimages/1001.jpg' },

  // Georgia DOT
  { id: 'ga_001', name: 'I-285 Atlanta', lat: 33.7490, lon: -84.3880, state: 'GA', url: 'https://www.511ga.org', img: 'https://www.511ga.org/images/cctv/atl001.jpg' },

  // Florida DOT
  { id: 'fl_001', name: 'I-4 Orlando', lat: 28.5383, lon: -81.3792, state: 'FL', url: 'https://fl511.com', img: 'https://fl511.com/images/cameras/orlando_001.jpg' },
  { id: 'fl_002', name: 'I-95 Miami', lat: 25.7617, lon: -80.1918, state: 'FL', url: 'https://fl511.com', img: 'https://fl511.com/images/cameras/miami_001.jpg' },
  { id: 'fl_003', name: 'I-10 Jacksonville', lat: 30.3322, lon: -81.6557, state: 'FL', url: 'https://fl511.com', img: 'https://fl511.com/images/cameras/jax_001.jpg' },

  // North Carolina DOT
  { id: 'nc_001', name: 'I-485 Charlotte', lat: 35.2271, lon: -80.8431, state: 'NC', url: 'https://nc511.org', img: 'https://www.ncdot.gov/travel-maps/cctv/images/char001.jpg' },

  // Virginia DOT
  { id: 'va_001', name: 'I-495 Northern VA', lat: 38.8048, lon: -77.0469, state: 'VA', url: 'https://www.511virginia.org', img: 'https://www.511virginia.org/cameras/nova001.jpg' },
  { id: 'va_002', name: 'I-64 Richmond', lat: 37.5407, lon: -77.4360, state: 'VA', url: 'https://www.511virginia.org', img: 'https://www.511virginia.org/cameras/ric001.jpg' },

  // Maryland (I-95 Corridor)
  { id: 'md_001', name: 'I-695 Baltimore Beltway', lat: 39.2904, lon: -76.6122, state: 'MD', url: 'https://chart.maryland.gov', img: 'https://chart.maryland.gov/CameraImages/cam_001.jpg' },

  // Pennsylvania DOT
  { id: 'pa_001', name: 'I-76 Philadelphia', lat: 39.9526, lon: -75.1652, state: 'PA', url: 'https://www.511pa.com', img: 'https://www.511pa.com/cameras/philly_001.jpg' },
  { id: 'pa_002', name: 'I-279 Pittsburgh', lat: 40.4406, lon: -79.9959, state: 'PA', url: 'https://www.511pa.com', img: 'https://www.511pa.com/cameras/pitt_001.jpg' },

  // New York
  { id: 'ny_001', name: 'I-278 NYC (Staten Island)', lat: 40.6501, lon: -74.0025, state: 'NY', url: 'https://511ny.org', img: 'https://511ny.org/cctv/nyc001.jpg' },
  { id: 'ny_002', name: 'I-87 Albany', lat: 42.6526, lon: -73.7562, state: 'NY', url: 'https://511ny.org', img: 'https://511ny.org/cctv/alb001.jpg' },

  // New Jersey
  { id: 'nj_001', name: 'NJ Turnpike Newark', lat: 40.7357, lon: -74.1724, state: 'NJ', url: 'https://www.511nj.org', img: 'https://www.511nj.org/cameras/njtp001.jpg' },

  // Connecticut
  { id: 'ct_001', name: 'I-95 New Haven', lat: 41.3083, lon: -72.9279, state: 'CT', url: 'https://www.ct511.com', img: 'https://www.dot.ct.gov/traffic/cctv/nh001.jpg' },

  // Massachusetts
  { id: 'ma_001', name: 'I-93 Boston', lat: 42.3601, lon: -71.0589, state: 'MA', url: 'https://www.mass511.com', img: 'https://www.mass511.com/images/cctv/bos001.jpg' },

  // Colorado DOT
  { id: 'co_001', name: 'I-70 Denver/Vail Pass', lat: 39.5501, lon: -106.3500, state: 'CO', url: 'https://cotrip.org', img: 'https://cotrip.org/images/cameras/vailpass.jpg' },
  { id: 'co_002', name: 'I-25 Denver', lat: 39.7392, lon: -104.9903, state: 'CO', url: 'https://cotrip.org', img: 'https://cotrip.org/images/cameras/i25_001.jpg' },

  // Arizona DOT
  { id: 'az_001', name: 'I-10 Phoenix', lat: 33.4484, lon: -112.0740, state: 'AZ', url: 'https://az511.gov', img: 'https://www.az511.gov/CameraImages/az001.jpg' },
  { id: 'az_002', name: 'I-17 Flagstaff', lat: 35.1983, lon: -111.6513, state: 'AZ', url: 'https://az511.gov', img: 'https://www.az511.gov/CameraImages/flag001.jpg' },

  // California DOT (Caltrans - public)
  { id: 'ca_001', name: 'I-5 Los Angeles', lat: 34.0522, lon: -118.2437, state: 'CA', url: 'https://quickmap.dot.ca.gov', img: 'https://cwwp2.dot.ca.gov/data/d07/cctv/image/id-la-001/id-la-001.jpg' },
  { id: 'ca_002', name: 'I-80 San Francisco Bay Bridge', lat: 37.7983, lon: -122.3778, state: 'CA', url: 'https://quickmap.dot.ca.gov', img: 'https://cwwp2.dot.ca.gov/data/d04/cctv/image/id-sf-baybridge/id-sf-baybridge.jpg' },
  { id: 'ca_003', name: 'I-405 Los Angeles', lat: 33.9731, lon: -118.3750, state: 'CA', url: 'https://quickmap.dot.ca.gov', img: 'https://cwwp2.dot.ca.gov/data/d07/cctv/image/id-la-405/id-la-405.jpg' },
  { id: 'ca_004', name: 'US-101 San Francisco', lat: 37.7749, lon: -122.4194, state: 'CA', url: 'https://quickmap.dot.ca.gov', img: 'https://cwwp2.dot.ca.gov/data/d04/cctv/image/id-sf-101/id-sf-101.jpg' },

  // Oregon DOT
  { id: 'or_001', name: 'I-5 Portland', lat: 45.5051, lon: -122.6750, state: 'OR', url: 'https://tripcheck.com', img: 'https://images.tripcheck.com/CameraImages/large/1001.jpg' },

  // Washington State DOT
  { id: 'wa_001', name: 'I-5 Seattle', lat: 47.6062, lon: -122.3321, state: 'WA', url: 'https://wsdot.wa.gov/traffic', img: 'https://images.wsdot.wa.gov/nw/005vc18804.jpg' },
  { id: 'wa_002', name: 'I-90 Snoqualmie Pass', lat: 47.4001, lon: -121.4133, state: 'WA', url: 'https://wsdot.wa.gov/traffic', img: 'https://images.wsdot.wa.gov/sc/090vc14640.jpg' },

  // Nevada DOT
  { id: 'nv_001', name: 'I-15 Las Vegas', lat: 36.1699, lon: -115.1398, state: 'NV', url: 'https://nvroads.com', img: 'https://www.nvroads.com/CCTVImages/LV_001.jpg' },

  // Utah DOT
  { id: 'ut_001', name: 'I-15 Salt Lake City', lat: 40.7608, lon: -111.8910, state: 'UT', url: 'https://udot.utah.gov/tripplanner', img: 'https://udot.utah.gov/connect/wp-content/cameras/slc001.jpg' },

  // Montana DOT
  { id: 'mt_001', name: 'I-90 Billings', lat: 45.7833, lon: -108.5007, state: 'MT', url: 'https://www.mdt.mt.gov/travinfo', img: 'https://www.mdt.mt.gov/travinfo/cameras/bill001.jpg' },

  // Nebraska
  { id: 'ne_001', name: 'I-80 Omaha', lat: 41.2565, lon: -95.9345, state: 'NE', url: 'https://www.511.nebraska.gov', img: 'https://www.511.nebraska.gov/images/cameras/omaha001.jpg' },

  // South Dakota
  { id: 'sd_001', name: 'I-90 Rapid City', lat: 44.0805, lon: -103.2310, state: 'SD', url: 'https://sd511.org', img: 'https://sd511.org/cameras/rc001.jpg' },

  // North Dakota
  { id: 'nd_001', name: 'I-29 Fargo', lat: 46.8772, lon: -96.7898, state: 'ND', url: 'https://www.dot.nd.gov', img: 'https://www.dot.nd.gov/files/cameras/fargo001.jpg' },

  // Louisiana DOT
  { id: 'la_001', name: 'I-10 New Orleans', lat: 29.9511, lon: -90.0715, state: 'LA', url: 'https://www.511la.org', img: 'https://www.511la.org/cameras/no001.jpg' },
  { id: 'la_002', name: 'I-10 Baton Rouge', lat: 30.4515, lon: -91.1871, state: 'LA', url: 'https://www.511la.org', img: 'https://www.511la.org/cameras/br001.jpg' },

  // Mississippi DOT
  { id: 'ms_001', name: 'I-20 Jackson', lat: 32.2988, lon: -90.1848, state: 'MS', url: 'https://www.mdot.ms.gov', img: 'https://www.mdot.ms.gov/traffic/cameras/jxn001.jpg' },

  // Alabama DOT
  { id: 'al_001', name: 'I-65 Birmingham', lat: 33.5186, lon: -86.8104, state: 'AL', url: 'https://www.algotraffic.com', img: 'https://www.algotraffic.com/images/cameras/birmingham001.jpg' },

  // South Carolina
  { id: 'sc_001', name: 'I-26 Columbia', lat: 34.0007, lon: -81.0348, state: 'SC', url: 'https://www.511sc.org', img: 'https://www.511sc.org/cameras/columbia001.jpg' },

  // Arkansas DOT
  { id: 'ar_001', name: 'I-40 Little Rock', lat: 34.7465, lon: -92.2896, state: 'AR', url: 'https://idrivearkansas.com', img: 'https://idrivearkansas.com/cameras/lr001.jpg' },
];
