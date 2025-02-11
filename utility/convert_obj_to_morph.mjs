import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial } from "three";

export function createMorphGLTF(loadedMeshes) {
    return new Promise((resolve, reject) => {
        if (loadedMeshes.length < 2) {
            console.error("At least two meshes are required to create morph targets.");
            reject("Not enough meshes for morph targets.");
            return;
        }

        console.log("Base Mesh:", loadedMeshes[0]);
        const baseMesh = loadedMeshes[0].children[0];
        const baseGeometry = baseMesh.geometry.clone();

        // ✅ Ensure UVs exist in base mesh
        if (!baseGeometry.attributes.uv) {
            console.error("Base mesh is missing UV coordinates! Textures will not work.");
            reject("Base mesh is missing UV coordinates!");
            return;
        }

        const morphTargets = loadedMeshes.slice(1).map(mesh => mesh.children[0].geometry.attributes.position.array);

        // ✅ Create a new BufferGeometry for GLTF with morph targets
        const morphGeometry = new BufferGeometry();
        morphGeometry.setAttribute("position", baseGeometry.attributes.position);
        morphGeometry.setAttribute("uv", baseGeometry.attributes.uv); // ✅ Copy UVs
        morphGeometry.setIndex(baseGeometry.index);
        morphGeometry.morphAttributes.position = morphTargets.map(target => new Float32BufferAttribute(target, 3));

        // ✅ Apply material with texture support
        const material = new MeshStandardMaterial({ 
            color: 0xaaaaaa, 
            map: null,  // Texture will be applied later
            morphTargets: true 
        });

        const morphMesh = new Mesh(morphGeometry, material);

        // ✅ Export as GLTF and load it with GLTFLoader
        const exporter = new GLTFExporter();
        exporter.parse(morphMesh, (gltf) => {
            const blob = new Blob([JSON.stringify(gltf)], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            // ✅ Use GLTFLoader to load the in-memory GLTF model
            const loader = new GLTFLoader();
            loader.load(url, (loadedGLTF) => {
                resolve(loadedGLTF.scene); // ✅ Return the loaded model
            }, undefined, (error) => {
                reject("Error loading GLTF:", error);
            });

        }, { binary: false });
    });
}
