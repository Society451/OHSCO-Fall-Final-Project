const params = {
    speedFactor: 0.005,
    earthRadius: 5,
    sphereOpacity: 0.2,
    labelSize: 10
};

//create the scene and a camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, (window.innerWidth - 300) / window.innerHeight, 1, 1000);
camera.position.set(0, 50, 70);

//create the renderer and add it to the DOM
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.getElementById('render-area').appendChild(renderer.domElement);
resizeRenderer();

//add some orbit controls to the camera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

//LET THERE BE LIGHT
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

//load some textures
const textureLoader = new THREE.TextureLoader();

//create one strange blue rock
const earthGeometry = new THREE.SphereGeometry(params.earthRadius, 64, 64);
textureLoader.load('land_ocean_ice_8192.png', (texture) => {
    const earthMaterial = new THREE.MeshStandardMaterial({ map: texture });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);
});

//create a group for celestial bodies
const celestialGroups = new THREE.Group();
scene.add(celestialGroups);

//define the celestial bodies
const celestialBodies = [
    { name: 'Moon', radius: 15, speed: 0.05, color: 0xcccccc, tilt: Math.PI / 180 * 5, bodyRadius: 0.7 },
    { name: 'Mercury', radius: 20, speed: 0.04, color: 0xaaaaaa, tilt: Math.PI / 180 * 7, bodyRadius: 0.5 },
    { name: 'Venus', radius: 25, speed: 0.03, color: 0xaaaaaa, tilt: Math.PI / 180 * 7, bodyRadius: 0.7 },
    { name: 'Sun', radius: 30, speed: 0.02, color: 0xffff00, tilt: Math.PI / 180 * 7, bodyRadius: 1 },
    { name: 'Mars', radius: 35, speed: 0.015, color: 0xffffff, tilt: Math.PI / 180 * 7, bodyRadius: 0.7 },
    { name: 'Jupiter', radius: 40, speed: 0.01, color: 0xffffff, tilt: Math.PI / 180 * 7, bodyRadius: 0.8 },
    { name: 'Saturn', radius: 45, speed: 0.008, color: 0xffffff, tilt: Math.PI / 180 * 7, bodyRadius: 0.8 },
];

//store planet objects
const planetObjects = {};

let sunLight;

//create the celestial bodies
celestialBodies.forEach(body => {
    const bodyGroup = new THREE.Group();
    celestialGroups.add(bodyGroup);

    //create a orbit layer
    const layerGeometry = new THREE.SphereGeometry(body.radius, 64, 64);
    const layerMaterial = new THREE.MeshBasicMaterial({
        color: body.color,
        transparent: true,
        opacity: params.sphereOpacity,
        wireframe: true
    });
    const layerMesh = new THREE.Mesh(layerGeometry, layerMaterial);
    bodyGroup.add(layerMesh);
    layerMesh.userData = { speed: body.speed };

    //create a label for each of the celestial bodies
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.fillText(body.name, 0, 20);

    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: texture });
    const labelSprite = new THREE.Sprite(labelMaterial);
    labelSprite.scale.set(params.labelSize, params.labelSize / 2, 1);
    labelSprite.position.set(body.radius + 3, 0, 0);
    bodyGroup.add(labelSprite);

    // ceate a circular path for the orbit
    createCircularPath(bodyGroup, body.radius);

    //create the planet mesh
    const planetGeometry = new THREE.SphereGeometry(body.bodyRadius, 32, 32);
    const planetMaterial = new THREE.MeshBasicMaterial({ color: body.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetMesh.position.set(body.radius, 0, 0);
    bodyGroup.add(planetMesh);

    //LET THERE BE EVEN MORE LIGHT
    if (body.name === 'Sun') {
        sunLight = new THREE.PointLight(0xffffff, 1.5, 600);
        planetMesh.add(sunLight);
    }

    //store planet object details
    planetObjects[body.name] = { 
        mesh: planetMesh, 
        radius: body.radius, 
        tilt: body.tilt, 
        speed: body.speed, 
        label: labelSprite,
        orbitMesh: layerMesh
    };

    body.angle = 0;
});

//a function to create circular path for orbits
function createCircularPath(group, radius) {
    const circularGeometry = new THREE.BufferGeometry();
    const points = [];
    const angleStep = Math.PI / 180;

    for (let t = 0; t < 2 * Math.PI; t += angleStep) {
        const x = radius * Math.cos(t);
        const y = 0;
        const z = radius * Math.sin(t);
        points.push(x, y, z);
    }

    circularGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const circularMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const circularLine = new THREE.Line(circularGeometry, circularMaterial);
    group.add(circularLine);
}

//create particles for the background which are supposed to be stars and space dust and stuff
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 10000;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.8,
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Speed slider control
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

speedSlider.addEventListener('input', () => {
    params.speedFactor = parseFloat(speedSlider.value);
    speedValue.textContent = speedSlider.value;
});

//update planet positions based on their speed and radius
function updatePlanetPositions() {
    celestialBodies.forEach(body => {
        body.angle += body.speed * params.speedFactor;

        const x = body.radius * Math.cos(body.angle);
        const z = body.radius * Math.sin(body.angle);

        planetObjects[body.name].mesh.position.set(x, 0, z);
        planetObjects[body.name].label.position.set(x + 3, 0, z);
    });
}

//update planet visibility based on the html checkboxes
function updatePlanetVisibility() {
    Object.keys(planetObjects).forEach(name => {
        const checkbox = document.getElementById(`visibility-${name.toLowerCase()}`);
        if (checkbox) {
            const isVisible = checkbox.checked;
            planetObjects[name].mesh.visible = isVisible;
            planetObjects[name].label.visible = isVisible;
        }
    });
}

//add event listeners to visibility checkboxes
Object.keys(planetObjects).forEach(name => {
    const checkbox = document.getElementById(`visibility-${name.toLowerCase()}`);
    if (checkbox) {
        checkbox.addEventListener('change', updatePlanetVisibility);
    }
});

updatePlanetVisibility();

//toggle the visibility of all planet meshes/spheres
const planetMeshesCheckbox = document.getElementById('visibility-planet-meshes');

function togglePlanetMeshesVisibility() {
    const isVisible = planetMeshesCheckbox.checked;
    celestialGroups.children.forEach(group => {
        group.children.forEach(child => {
            if (child.material && child.material.wireframe) {
                child.visible = isVisible;
            }
        });
    });
}

planetMeshesCheckbox.checked = false;
togglePlanetMeshesVisibility();

planetMeshesCheckbox.addEventListener('change', togglePlanetMeshesVisibility);

//toggle the visibility of particles/stars
const particlesCheckbox = document.getElementById('visibility-particles');

if (particlesCheckbox) {
    particlesMesh.visible = particlesCheckbox.checked;
    particlesCheckbox.addEventListener('change', () => {
        particlesMesh.visible = particlesCheckbox.checked;
    });
}

//toggle usage of the sun as realistic light
const sunLightCheckbox = document.getElementById('toggle-sun-light');

if (sunLightCheckbox) {
    if (sunLight) {
        sunLight.visible = sunLightCheckbox.checked;
    }
    sunLightCheckbox.addEventListener('change', () => {
        if (sunLight) {
            sunLight.visible = sunLightCheckbox.checked;
        }
    });
}

//the animation loop
function animate() {
    requestAnimationFrame(animate);
    updatePlanetPositions();
    controls.update();

    particlesMesh.rotation.y += 0.0001;

    renderer.render(scene, camera);
}

animate();

//handle window resize
window.addEventListener('resize', () => {
    resizeRenderer();
});

//resize renderer and update camera aspect ratio
function resizeRenderer() {
    const width = window.innerWidth - 300;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// Sidebar functionality
const sidebar = document.getElementById('info-sidebar');
const minimizeButton = document.getElementById('minimize-button');
const resizeHandle = document.getElementById('resize-handle');

let isResizing = false;
let isDragging = false;
let isMinimized = false;
let startX, startY, startWidth, startHeight, startLeft, startTop;
let prevWidth = sidebar.offsetWidth;
let prevHeight = sidebar.offsetHeight;

function toggleSidebarMinimize() {
    isMinimized = !isMinimized;
    if (isMinimized) {
        prevWidth = sidebar.offsetWidth;
        prevHeight = sidebar.offsetHeight;
        sidebar.classList.add('minimized');
        minimizeButton.textContent = 'Maximize';
    } else {
        sidebar.classList.remove('minimized');
        sidebar.style.width = prevWidth + 'px';
        sidebar.style.height = prevHeight + 'px';
        minimizeButton.textContent = 'Minimize';
    }
}

// Use the unified function for both button click and double-click
minimizeButton.addEventListener('click', toggleSidebarMinimize);
sidebar.addEventListener('dblclick', toggleSidebarMinimize);

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
    document.documentElement.addEventListener('mousemove', doResize, false);
    document.documentElement.addEventListener('mouseup', stopResize, false);
});

sidebar.addEventListener('mousedown', (e) => {
    if (e.target === sidebar) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(document.defaultView.getComputedStyle(sidebar).left, 10);
        startTop = parseInt(document.defaultView.getComputedStyle(sidebar).top, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
    }
});

function doResize(e) {
    if (isResizing && !isMinimized) {
        sidebar.style.width = (startWidth + e.clientX - startX) + 'px';
        resizeRenderer();
    }
}

function stopResize() {
    isResizing = false;
    document.documentElement.removeEventListener('mousemove', doResize, false);
    document.documentElement.removeEventListener('mouseup', stopResize, false);
}

function doDrag(e) {
    if (isDragging) {
        let newLeft = startLeft + e.clientX - startX;
        let newTop = startTop + e.clientY - startY;

        // Prevent the sidebar from going off-screen
        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + sidebar.offsetWidth > window.innerWidth) {
            newLeft = window.innerWidth - sidebar.offsetWidth;
        }
        if (newTop + sidebar.offsetHeight > window.innerHeight) {
            newTop = window.innerHeight - sidebar.offsetHeight;
        }

        sidebar.style.left = newLeft + 'px';
        sidebar.style.top = newTop + 'px';
    }
}

function stopDrag() {
    isDragging = false;
    document.documentElement.removeEventListener('mousemove', doDrag, false);
    document.documentElement.removeEventListener('mouseup', stopDrag, false);
}
