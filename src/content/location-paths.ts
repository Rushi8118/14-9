/**
 * Route paths for the generated location pages.
 *
 * Literal strings, with no import of regional-coverage.ts, so registering these
 * routes in App.tsx does not pull the whole regional dataset into the main
 * bundle. The page content is still loaded lazily by LocationPage.
 *
 * React Router 7 matches a dynamic segment only when it occupies a whole path
 * segment, so `/visa-consultants-in-:place` never matches
 * `/visa-consultants-in-gujarat` -- it returns null, and every one of these
 * pages prerendered as the 404. Hence an explicit route per path. Moving the
 * param to its own segment (`/visa-consultants-in/:place`) would match, but it
 * would break the URL shape that mirrors how people search and that
 * /visa-consultants-in-surat already uses.
 *
 * DRIFT IS CAUGHT BY THE BUILD, not by discipline: scripts/seo-routes.mjs parses
 * the same routes out of regional-coverage.ts, and the prerender step fails the
 * build on any route that does not render its own page. A route missing here
 * renders the 404 and stops the build, which is exactly how this list was found
 * to be necessary.
 *
 * /visa-consultants-in-surat is not here: it has its own hand-written page and
 * its own static route.
 */
export const LOCATION_ROUTE_PATHS = [
  '/visa-consultants-in-gujarat',
  '/visa-consultants-in-punjab',
  '/visa-consultants-in-maharashtra',
  '/visa-consultants-in-delhi-ncr',
  '/visa-consultants-in-karnataka',
  '/visa-consultants-in-telangana',
  '/visa-consultants-in-andhra-pradesh',
  '/visa-consultants-in-tamil-nadu',
  '/visa-consultants-in-kerala',
  '/visa-consultants-in-haryana',
  '/visa-consultants-in-rajasthan',
  '/visa-consultants-in-uttar-pradesh',
  '/visa-consultants-in-west-bengal',
  '/visa-consultants-in-madhya-pradesh',
  '/visa-consultants-in-bihar',
  '/visa-consultants-in-odisha',
  '/visa-consultants-in-goa',
  '/visa-consultants-in-assam',
  '/visa-consultants-in-arunachal-pradesh',
  '/visa-consultants-in-manipur',
  '/visa-consultants-in-meghalaya',
  '/visa-consultants-in-mizoram',
  '/visa-consultants-in-nagaland',
  '/visa-consultants-in-sikkim',
  '/visa-consultants-in-tripura',
  '/visa-consultants-in-himachal-pradesh',
  '/visa-consultants-in-uttarakhand',
  '/visa-consultants-in-jammu-kashmir',
  '/visa-consultants-in-ladakh',
  '/visa-consultants-in-jharkhand',
  '/visa-consultants-in-chhattisgarh',
  '/visa-consultants-in-chandigarh',
  '/visa-consultants-in-puducherry',
  '/visa-consultants-in-ahmedabad',
  '/visa-consultants-in-vadodara',
  '/visa-consultants-in-rajkot',
  '/visa-consultants-in-bhavnagar',
  '/visa-consultants-in-jamnagar',
  '/visa-consultants-in-navsari',
  '/visa-consultants-in-anand',
  '/visa-consultants-in-mehsana',
  '/visa-consultants-in-vapi',
] as const
