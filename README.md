# xrpackage

<p align="center">
  <img src="./assets/logo.png" width="250px" height="250px">
</p>

XRPackage turns 3D apps into a file you can load anywhere.

It uses standards like WebXR, GLTF, and WebBundle to package an app into a `.wbn` file. It provides a runtime to load multiple `.wbn` applications at once into a shared composited world. Finally, XRPackage provides a package registry distributed on IPFS / Ethereum, to easily share your XRPackage applications. The registry follows the ERC1155 standard so packages can be traded on OpenSea.

## What's in a package?

An XRPackage is a bundle of files. The entrypoint is a `manifest.json` (following the [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) standard). The rest of the files in the bundle are the source files for the app.

The main addition to the Web App Manifest specification is the `xr_type` field, which specifies the type of application and the spec version.

```
$ cat manifest.json
{
  "xr_type": "webxr-site@0.0.1",
  "start_url": "cube.html"
}
```

`xr_type` can currently be:

- `webxr-site@0.0.1`
- `gltf@0.0.1`
- `vrm@0.0.1`
- `vox@0.0.1`

See also the [examples](https://docs.webaverse.com/docs/create/examples).

## Asset packages

Asset packages are those with the following types:

- `gltf@0.0.1`
- `vrm@0.0.1`
- `vox@0.0.1`

These types of packages represent only a static asset to be loaded. The corresponding asset file is referenced in the `start_url` field of `manifest.json`.

## WebXR packages

A WebXR package references the `index.html` entrypoint for the webXR application in the `start_url` field of the `manifest.json` file. `index.html` should be a regular WebXR application, with its assets referenced using relative paths.

Because XRPackage is a spatial packaging format, the main additional requirement is that the WebXR application autoimatically starts its WebXR session upon receiving the `sessiongranted` event (see the [WebXR Navigation Specification](https://github.com/immersive-web/webxr/blob/master/designdocs/navigation.md) and the [example](https://github.com/webaverse/xrpackage/blob/88a87d296019530f4f76ec18ce64f9397cd4b27d/examples/html/cube.html#L25).

## Package icons

Packages can contain icons that represent them in previews. Multiple icons can be in the same package, with different types. The icon files are included along with the package as a regular part of the bundle and referenced in the manifest. This follows the web bundle standard.

Icons are used not only for rendering a preview for the package, but also specify how it behaves in relation to other packages. For example, the collision mesh icon type (`"model/gltf-binary+preview"`) specifies the collision boundary geometry that the package uses, in GLTF form.

```
{
  "xr_type": "webxr-site@0.0.1",
   "start_url": "cube.html",
  "icons": [
    {
      "src": "icon.gif",
      "type": "image/gif" // screen capture
    },
    {
      "src": "collision.glb",
      "type": "model/gltf-binary+preview" // collision mesh
    },
    {
      "src": "xrpackage_model.glb",
      "type": "model/gltf-binary" // gltf preview
    }
  ]
}
```

## Package configuration

The package manifest can contain an `xr_details` field which further specifies how it should be treated by a compatible runtime.

```
{
  "xr_type": "webxr-site@0.0.1",
    "start_url": "cube.html",
    "xr_details": {
      "schema": { // describes configurable properties of the package
        "floofiness": {
          "type": "string", // currently only "string"
          "default": "very"
        }
      },
      "events": { // describes events the we can receive from other packages
        "refloof": {
          "type": "string"
        }
      },
      "aabb": [ // axis-aligned bounding box
        [-1, -1, -1], // min point
        [1, 1, 1] // max point
      ],
      "wearable": { // how this package can be worn on an avatar
        "head": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], // matrix offset from specified bone to package
        "hand": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        "back": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
      },
      "physics": "static" // physics mode for the packge: null (no physics, default), "static", or "dynamic"
    }
  }
}
```

## Building a package

Regardless of package type, packages are built with the `xrpk` tool which you can get on `npm`:

```
$ npm install -g xrpk

```

To build a package with `manifest.json` in the current directory:

```
$ xrpk build .
a.wbn
```

Note: this will open up your browser to perform screenshotting of the application; you can close that tab when it completes.

The resulting package is `a.wbn`. It will also output `a.wbn.gif` as a screenshot and `a.wbn.glb` as a 3D model preview -- these are used when publishing your package but are not required to run it.

## Test the package

Once you have a package (`a.wbn`), you can run it in your browser like so:

```
$ xrpk run ./a.wbn
```

This will open up the `xrpackage.js` runtime in your browser and load the given file for viewing.

## Run XRPackage programmatically

See [run.html](https://github.com/webaverse/xrpackage-site/blob/master/run.html) for the full example.

```
import {XRPackageEngine, XRPackage} from 'https://static.xrpackage.org/xrpackage.js';
const pe = new XRPackageEngine();
document.body.appendChild(pe.domElement);

const res = await fetch('a.wbn'); // built package stored somewhere
const arrayBuffer = await res.arrayBuffer();
const p = new XRPackage(new Uint8Array(arrayBuffer));
pe.add(p);
```

You can also compile a `.wbn` package programmatically:

```
const uint8Array = XRPackage.compileRaw(
	[
	  {
	    url: '/cube.html',
	    type: 'text/html',
	    data: cubeHtml,
	  },
	  {
	    url: '/manifest.json',
	    type: 'application/json',
	    data: cubeManifest,
	  }
	]
);
// save uint8Array somewhere or new XRPackage(uint8Array)
```

## Publish packages: log into wallet

```
xrkp login
```

Follow the prompts to create or import a wallet. It is a regular BIP39 mnemonic.

## Check your wallet address

```
xrkp whoami
```

## Publish a package

Note: Rinkeby testnet only. You will need sufficient Rinkeby testnet ETH balance in your wallet address to publish. You can get free Rinkeby testnet ETH at the [faucet](https://faucet.rinkeby.io/).

Once you are ready, you can publish a package to your wallet with this command:

```
xrkp publish a.wbn
```

The contracts used are here: https://github.com/webaverse/contracts

## Browse published packages

You can browse the list of published packages [here](https://xrpackage.org/browse.html).

## Install a published package

```
xrpk install [id]
```

This will download the given package id locally.

## See also

The [frontend site for XRPackage](https://github.com/webaverse/xrpackage-site)

## Testing XRPackage

Tests are in the [`./tests`](./tests) directory, using [AVA](https://github.com/avajs/ava).

Running `npm run test` in the root directory will automatically run all the tests in the [`./tests`](./tests) directory and output the results in the terminal.

Helper functions are available in [`./tests/utils`](./tests/utils). If your test requires a browser (Puppeteer), you'll need to use `_withPageAndStaticServer.js` to create a page and setup a temporary express server for the test suite. For example, a test can look like:

```js
const test = require("ava");

const withPageAndStaticServer = require('./utils/_withPageAndStaticServer');

test('your test', withPageAndStaticServer, async (t, page) => {
  // Your test logic, using `t.context.staticUrl`
  t.pass();
});
```

Note that `withPageAndStaticServer` sets the test's context `t.context.staticUrl` to be the base URL for the static server, e.g. `localhost:64880` whose root is [`./tests/static`](./tests/static).

## Debugging locally

If you want to develop a copy of `xrpackage` locally, serve it from a server, and make sure to set the `sw.js` to local development mode:

https://github.com/webaverse/xrpackage/blob/master/sw.js#L1

Then you should be able to `import 127.0.0.1:3000/xrpackage.js` or wherever you are serving `xrpackage` from. Note you can run `node ./server.js` in the root folder to locally serve this repo.

A quick way to iterate and test this repo against live xr packages is to serve xrpackage.org's [front end](https://github.com/webaverse/xrpackage-site) locally as well (you can copy this repo's `server.js` over, but if you do **make sure to change the port number so they don't overlap**) and change all of references to `xrpackage.js` in _that_ repo to your locally served `xrpackage.js` per above.
For example, in `run.js` you'll want to change line 2 from:
`import {XRPackageEngine, XRPackage} from 'https://static.xrpackage.org/xrpackage.js';`
to:
`import { XRPackageEngine, XRPackage } from "http://127.0.0.1:3000/xrpackage.js";`
(Or whatever your local server / port number is).

Make sure to change the references to `xrpackage.js` across the repo in any files you're loading: https://github.com/webaverse/xrpackage-site/search?q=static.xrpackage.org%2Fxrpackage.js

Also note that you'll want to clear all caches when you serve `xrpackage-site`, probably run it in incognito (cache-less) mode and refresh several times if you run into errors. Please make sure you do so before filing any issues.

## Tips:

### Building packages

- Use transparent backgrounds if possible to make it easier to compose multiple pacakges
- Be mindful of size to improve loading speeds

### Deploying to your own website

The XRPackage uses [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) to serve packages on a page. In order to get this working, you will need to add a file called `sw.js` to the root of your website with the following contents:

```js
importScripts("https://static.xrpackage.org/sw.js");
```

### Secure origins

Service workers only work on secure origins. If you are running a local server, make sure chrome considers it secure, such as `https://` or `localhost`. Note that local routes like `192.168.0.2` are generally _not_ considered secure.

### Running in Brave

You may run into issues on Brave where it'll block XRPackage from running any Three.js code due to it's cross-origin fingerprint blocking. You will need to either serve all the XRPackage code from the same origin, or tell users to click the `Brave Shield` and allow fingerprinting for your website.

### CTRL+SHIFT+R and Service Workers

The `CTRL+SHIFT+R` shortcut will unload service workers on the current path and will cause XRPackage to not initialize properly. If you are being thrown to the debugger with a warning that the service worker registration timed out, try closing your browser window and reloading the URL _without_ using the no-cache reload shortcut.
