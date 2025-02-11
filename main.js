import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Howl, Howler } from 'howler';
import { GUI } from 'dat.gui'
import { createMorphGLTF } from './utility/convert_obj_to_morph.mjs';
import { animatePhonemes } from './utility/phonemeAnimator';
import { convertPhonemes } from './utility/phoneme_converson';
import gsap from "gsap";

let phoneme = {}

fetch("data/word_phonemes.json")
    .then(response => response.json())
    .then(data => {
        console.log("Loaded word timing data:", data);
        phoneme = data;


    })
    .catch(error => console.error("Error loading JSON:", error));


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000000, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Lighting
const light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8 * Math.PI);
const light2 = new THREE.AmbientLight(0xFFFFFF, 0.5);
const light3 = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light1, light2, light3)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White directional light
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);




// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 1;




// Variables for animation
const totalFrames = 15; // Number of OBJ files in sequence
const objFiles = []; // Array to hold OBJ file paths
const objects = []; // Array to hold loaded objects


//Load file paths for each expression

for (let i = 0; i < totalFrames; i++) {
    const objFile = `expression_transfer/${i}/real_test/animation/real_test.obj`; // Replace with actual paths
    objFiles.push(objFile);
}

// Load OBJ and MTL Files
const mtlLoader = new MTLLoader();
const objLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader();


// Load textures
const diffuseTexture = textureLoader.load('materials/real_test.png', () => {
    diffuseTexture.colorSpace = THREE.SRGBColorSpace;
    console.log("Diffuse texture loaded!");
});


//load all object files
function objectLoader(filepath) {
    return new Promise((resolve, reject) => {
        mtlLoader.load('materials/real_test.mtl', (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load(
                filepath,
                (object) => {
                    object.visible = false; // Start with object hidden
                    object.scale.set(0.8, 0.8, 0.8);
                    scene.add(object);
                    objects.push(object);
                    resolve(object); // Resolve when object is loaded
                },
                undefined,
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    });
}

//convert and objfiles to single gltf file and add to the scene

function finalLoader(loadedModel) {
    return new Promise((resolve, reject) => {
        console.log("GLTF Loaded:", loadedModel);
        const model = loadedModel;
        console.log(loadedModel)
        scene.add(model);

        model.traverse((child) => {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide; // Render both sides
                child.material.depthTest = true;        // Prevents z-fighting
                child.material.depthWrite = true;       // Ensures proper depth sorting
                child.material.transparent = false;     // Removes any unwanted transparency
                child.material.opacity = 1.0;           // Fully opaque
                child.geometry.computeVertexNormals();  //
                // child.geometry.computeVertexNormals();
                console.log("Applying texture to:", child.name);
                // console.log(child.geometry.attributes.uv);
                console.log("UVs:", child.geometry.attributes.uv);
                // Ensure the material supports textures
                // child.material.flatShading = true;
                child.material = new THREE.MeshBasicMaterial({
                    map: diffuseTexture,
                    opacity: 2,


                });


                child.material.needsUpdate = true;
            }

        });
        const morphMesh = model.children[0]; // Get first mesh with morph targets
        console.log("Morph Mesh:", morphMesh);

        if (morphMesh.morphTargetInfluences) {
            // animateMorph(morphMesh);
        } else {
            console.error("Morph targets not found in loaded model.");
        }


        resolve(model);



    });
}



async function loadAndAnimate() {
    try {
        const objects = await Promise.all(objFiles.map(file => objectLoader(file)));
        console.log(`All ${objects.length} objects loaded.`);

        const model = await createMorphGLTF(objects);
        return await finalLoader(model);
    } catch (error) {
        console.error("Error loading objects or model:", error);
    }
}

const modelFace = await loadAndAnimate();

let model;

console.log(modelFace)
const morphMesh = modelFace.children[0];
// Load model and apply animation

const hairLoader = new GLTFLoader();
let hairModel = 2;

// Emotion Animation
function animateEmotion(emotion) {
    const emotionToMorphTargets = {
        "happy": ["Smile", "EyesWide"],
        "sad": ["Frown", "EyesClosed"],
        "angry": ["Frown", "MouthTight"]
    };

    if (!model) return;

    model.traverse((child) => {
        if (child.isMesh && child.geometry.morphAttributes.position) {
            const targets = emotionToMorphTargets[emotion];
            targets.forEach((target) => {
                const morphIndex = child.geometry.morphAttributes.position.findIndex(
                    (morph) => morph.name === target
                );
                if (morphIndex !== -1) {
                    child.morphTargetInfluences[morphIndex] = 1.0;
                }
            });

            setTimeout(() => {
                targets.forEach((target) => {
                    const morphIndex = child.geometry.morphAttributes.position.findIndex(
                        (morph) => morph.name === target
                    );
                    if (morphIndex !== -1) {
                        child.morphTargetInfluences[morphIndex] = 0.0;
                    }
                });
            }, 1000); // Reset after 1 second
        }
    });
};

window.handleHair = function () {
    const selectedValue = document.getElementById('numberSelect').value;

    // If the hair model hasn't changed, we don't need to reload it
    if (hairModel !== selectedValue) {
        hairModel = selectedValue;
        console.log(scene)

        // Remove the current hair model based on its properties (not just name)
        scene.traverse((child) => {
            // Check if the child is a mesh and has properties that indicate it is the hair model
            if (child.isMesh && child.material) {
                console.log("found  mesh ")
                // For example, check if it uses a specific material or geometry
                // You could also check for a specific name or group (if you know it)
                if (child.name.includes("hair")) {  // Or any identifying property
                    scene.remove(child); // Remove the hair object
                }
            }
        });

        // Load the new hair model
        loadHairModel(hairModel);
    }
}

const gui = new GUI({ width: 600 })
function loadHairModel(hairIndex) {


    hairLoader.load(`hair/all.glb`, function (gltf) {
        const headModel = gltf.scene.children[hairIndex];
        // scene.add(headModel);

        const hairModel = gltf.scene.children[hairIndex];

        // Check if the hair model has a texture
        if (hairModel.material && hairModel.material.map) {
            console.log("Texture applied: ", hairModel.material.map);
        } else {
            console.log("No texture found, applying default color.");
        }

        var conf = { color: '#ffae23' };
        // Apply color to hair if no texture is found
        const hairMaterial = new THREE.MeshPhongMaterial({
            color: conf.color, // Brown color for hair
            // roughness: 0,
            // metalness: 0.0,
            shininess: 100

        });

        gui.addColor(conf, 'color').onChange(function (colorValue) {
            hairModel.material.color.set(colorValue);
        });

        hairModel.traverse((child) => {
            // if (child.isMesh) {
            // if (child.material.map) {
            child.material = hairMaterial;  // Apply color if no texture
            // }
            // }
        });
        console.log(hairModel)

        const hairUi = gui.addFolder("Hair Model")
        const hairRotaion = hairUi.addFolder("Hair Rotaion")
        hairRotaion.add(hairModel.rotation, "x", 0, Math.PI * 2);
        hairRotaion.add(hairModel.rotation, "y", 0, Math.PI * 2);
        hairRotaion.add(hairModel.rotation, "z", 0, Math.PI * 2);
        const hairScale = hairUi.addFolder("Hair Scale")
        hairScale.add(hairModel.scale, "x", 0, 1).step(0.00001);
        hairScale.add(hairModel.scale, "y", 0, 2).step(0.00001);
        hairScale.add(hairModel.scale, "z", 0, 2).step(0.00001);
        const hairPosition = hairUi.addFolder("Hair Position")
        hairPosition.add(hairModel.position, "x", -5, 5).step(0.001)
        hairPosition.add(hairModel.position, "y", -5, 5).step(0.001)
        hairPosition.add(hairModel.position, "z", -5, 5).step(0.001)

        scene.add(hairModel);
    });
}
loadHairModel(2)
window.handleInteraction = function () {
    let audioIndex = 0;
    // Example LLM response (you would get this dynamically from the backend)
    const llmResponse = {
        responses: [
            { "text": "I'm so happy to help you!", "emotion": "happy" },
            // { "text": "Oh no, that sounds like a problem.", "emotion": "sad" }
        ]
    };

    // Function to sync audio and animation for each sentence
    function syncAudioAndAnimation(wordTimingData, emotion) {
        const audioFileName = `audio/${emotion}.wav`;  // Construct the filename based on emotion (e.g., "happy_0.wav")

       

        // Load the corresponding audio file
        const sound = new Howl({
            src: [audioFileName],  // Load the corresponding audio file for the emotion
            html5: true,
            onplay: () => {
                console.log(`${emotion} audio started playing...`);
                syncAnimationWithAudio(); // Start syncing the animation with the audio
            },
            onend: () => {
                fadeOutToNeutralPose(); // Stop the animation after the audio finishes
                console.log(`${emotion} audio ended.`);
                audioIndex = audioIndex + 1
                // if (audioIndex <= llmResponse.responses.length) {

                //     startNextAudio(audioIndex); // Start the next audio (only if there are more to play)
                // }
            }
        });

        sound.play();


        // Animate Phonemes and Emotion (if needed, you can split phoneme-level animations)
        animateEmotion(emotion);

        // Synchronize animation with audio
        let lastPhoneme = null;
        function syncAnimationWithAudio() {
          
        
            let lastPhoneme = null;
            let lastTimestamp = 0;
            let lastProgress = 0;
        
            function renderFrame() {
                if (!sound.playing()) {
                    console.log("⏹ Stopping animation loop as audio has ended.");
                    fadeOutToNeutralPose();
                    return; 
                }
            
                const playbackPosition = sound.seek() * 1000; // Convert to milliseconds
                let currentPhoneme = null;
                let currentStart = 0;
                let currentEnd = 0;
            
                for (const wordData of wordTimingData) {
                    if (playbackPosition >= wordData.start * 10 && playbackPosition <= wordData.end * 10) {
                        currentPhoneme = wordData.phoneme.split(" ");
                        currentStart = wordData.start * 10;
                        currentEnd = wordData.end * 10;
                        break;
                    }
                }
            
                if (!currentPhoneme || playbackPosition > currentEnd) {
                    if (lastPhoneme !== null) {
                        // console.log(`🔻 Phoneme '${lastPhoneme}' finished at ${playbackPosition}ms`);
                        fadeOutToNeutralPose();
                        lastPhoneme = null;
                    }
                    currentPhoneme = null;
                }
            
                if (currentPhoneme) {
                    const animatablePhonemes = convertPhonemes(currentPhoneme);
                    let progress = (playbackPosition - currentStart) / (currentEnd - currentStart);
                    progress = Math.min(Math.max(progress, lastProgress * 0.85), 1);
            
                    const totalPhonemes = currentPhoneme.length;
                    const phonemeDuration = (currentEnd - currentStart) / totalPhonemes;
            
                    // console.log(`🎭 Phonemes: ${currentPhoneme} | Duration per phoneme: ${phonemeDuration}s`);
                    // console.log(`current end:${currentEnd}  playback:${playbackPosition}`);
            
                    if (lastPhoneme !== currentPhoneme.join(" ")) {
                        if (currentEnd > playbackPosition) {
                            animatePhonemes(morphMesh, animatablePhonemes, phonemeDuration);
                        }
                        lastPhoneme = currentPhoneme.join(" ");
                        lastTimestamp = playbackPosition;
                        lastProgress = progress;
                    }
                }
            
                renderer.render(scene, camera);
            
                if (sound.playing()) {
                    requestAnimationFrame(renderFrame);
                } else {
                    console.log("✅ Audio has ended, stopping animation loop.");
                    fadeOutToNeutralPose(); // Ensure a smooth transition back to neutral
                }
            }
            
        
            renderFrame(); // Start animation loop
        }
        

        function fadeOutToNeutralPose() {
            if (!morphMesh || !morphMesh.morphTargetInfluences) return;
        
            gsap.to(morphMesh.morphTargetInfluences, {
                duration: 0.2, // Reduce duration for quick transition
                ease: "power2.out",
                onUpdate: () => {
                    for (let i = 0; i < morphMesh.morphTargetInfluences.length; i++) {
                        morphMesh.morphTargetInfluences[i] = 0.0; // Ensure all morphs are reset
                    }
                },
                onComplete: () => {
                    console.log("✅ Morph targets reset to neutral.");
                }
            });
        }
        


    }

    // This function will handle the sequential audio playing


    // Function to start the next audio after the previous one finishes
    function startNextAudio(index) {
        if (index < llmResponse.responses.length) {
            const { text, emotion } = llmResponse.responses[index];
            console.log(`Processing sentence: "${text}" with emotion: ${emotion}`);
            syncAudioAndAnimation(phoneme, emotion);
        }
    }

    // Start the first audio
    startNextAudio(audioIndex);
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

