import { withHarper } from '@harperfast/nextjs';

// `withHarper` wires this Next.js app into Harper: it marks the `harper` package as a server
// external so `import 'harper'` resolves to the running Harper runtime (rather than being bundled),
// giving server-side code access to the `tables` global. Add your own Next.js config inside.
export default withHarper({});
