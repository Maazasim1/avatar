import gsap from "gsap";

// Phoneme-morph target mapping
const phonemeAnimations = {
    "AA": [1,1,1],   // Open mouth
    "EE": [2],   // Wide lips
    "OO": [3],   // Rounded lips
    "F/V": [4],  // Teeth on lip
    "TH": [1,5,1],   // Tongue between teeth
    "M/B/P": [6],// Closed lips
    "S/SH": [7], // Tensed lips
    "R": [8],    // Tongue curled
    "L": [9],    // Tongue touching roof
    "D": [10],   // Quick tongue flick
    "T": [11],   // Similar to D
    "N": [12],   // Nasal
    "G": [10],   // Soft palate
    "K": [14],   // Hard palate
    "Y": [15],   // Soft tongue push
};

/**
 * Animate morph targets for a given phoneme sequence.
 * @param {Mesh} mesh - The Three.js mesh with morph targets.
 * @param {string[]} phonemeSequence - The phoneme list to animate.
 * @param {number} duration - Duration of phoneme in milliseconds.
 */
export function animatePhonemes(mesh, phonemeSequence, duration) {
    if (!mesh || !mesh.morphTargetInfluences) {
        console.error("Morph targets not found on the mesh.");
        return;
    }

    const morphTargets = phonemeSequence.flatMap(phoneme => phonemeAnimations[phoneme] || [6]);
    const timeline = gsap.timeline();

    // Apply phoneme animation smoothly
    console.log(phonemeSequence)
    timeline.to(mesh.morphTargetInfluences, {
        duration: duration * 0.8 / 100, // Convert ms to seconds
        ease: "power2.out",
        onUpdate: () => {
            for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                if (morphTargets.includes(i)) {
                    mesh.morphTargetInfluences[i] = gsap.utils.clamp(0, 1, mesh.morphTargetInfluences[i] + 0.1); // 🔥 Smooth buildup
                } else {
                    mesh.morphTargetInfluences[i] *= 0.2;  // Fade out slower
                }
            }
        }
    });

    // Gradual fade-out instead of instant reset
    timeline.to(mesh.morphTargetInfluences, {
        duration: duration * 0.2 / 100,
        ease: "power2.inOut",
        onUpdate: () => {
            for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                mesh.morphTargetInfluences[i] *= 0.6;  // More natural decay
            }
        },
        onComplete: () => {
            for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                mesh.morphTargetInfluences[i] = 0.0; // Reset to neutral
            }
        }
    });
}



