import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';


// initialize threejs
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
camera.position.z = 5;
// threejs scene

const assetId = "2275057";
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZjk1OTU2My1mNDBhLTQzYzEtOTcxMS01MzNiOWIxMDZiYTMiLCJpZCI6MTY2MDkxLCJpYXQiOjE2OTQ1NDMyOTN9.rHxFqNMZ26EFHwHYUJ-xW0fDZtjamHXiM-4HR6YIHXY"

var tiles
// fetch a temporary token for the Cesium Ion asset
var url = new URL( `https://api.cesium.com/v1/assets/${ assetId }/endpoint` );
url.searchParams.append( 'access_token', accessToken );

fetch( url, { mode: 'cors' } )
	.then( res => res.json() )
	.then( json => {

		url = new URL( json.url );

		const version = url.searchParams.get( 'v' );
		tiles = new TilesRenderer( url );
		tiles.fetchOptions.headers = {};
		tiles.fetchOptions.headers.Authorization = `Bearer ${json.accessToken}`;

		// Prefilter each model fetch by setting the cesium Ion version to the search
		// parameters of the url.
		tiles.onPreprocessURL = uri => {

			uri = new URL( uri );
			uri.searchParams.append( 'v', version );
			return uri;

		};

	} );

const tilesRenderer = new TilesRenderer( './path/to/tileset.json' );
// tilesRenderer.setCamera( camera );
// tilesRenderer.setResolutionFromRenderer( camera, renderer );
// scene.add( tiles.group );

// renderLoop();

function renderLoop() {

	requestAnimationFrame( renderLoop );

	// The camera matrix is expected to be up to date
	// before calling tilesRenderer.update
	camera.updateMatrixWorld();
	tilesRenderer.update();
	renderer.render( scene, camera );

}

function animate() {
	requestAnimationFrame( animate );
	camera.updateMatrixWorld();
	// tilesRenderer.update();
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render( scene, camera );
}

animate();