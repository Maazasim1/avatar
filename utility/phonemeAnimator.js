import gsap from "gsap";

// Phoneme-morph target mapping
const phonemeAnimations = {
    "AA": [1],   // Open mouth
    "EE": [2],       // Wide lips
    "OO": [3],       // Rounded lips (needs scaling)
    "F/V": [4],      // Teeth on lip
    "TH": [5],   // Tongue between teeth
    "M/B/P": [6],    // Closed lips
    "S/SH": [7],     // Tensed lips
    "R": [8],        // Tongue curled
    "L": [9],        // Tongue touching roof
    "D": [10],       // Quick tongue flick
    "T": [11],       // Similar to D
    "N": [12],       // Nasal
    "G": [10],       // Soft palate
    "K": [14],       // Hard palate
    "Y": [15],       // Soft tongue push
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

    const morphTargets = phonemeSequence.flatMap(phoneme => {
        console.log(phoneme)
        return phonemeAnimations[phoneme]||["AA"]});
    const timeline = gsap.timeline();

   

    // Apply phoneme animation smoothly
    timeline.to(mesh.morphTargetInfluences, {
        duration: duration  / 1000, // Convert ms to seconds
        ease: "power2.out",
        onUpdate: () => {
            for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                if (morphTargets.includes(i)) {
                    let influence = gsap.utils.clamp(0, 1, mesh.morphTargetInfluences[i] * 0.8 + 0.2);
                    
                    mesh.morphTargetInfluences[i] = influence; // Apply influence
                } else {
                    mesh.morphTargetInfluences[i] *= 0.2;  // Fade out slower
                }
            }
        }
    });

    // Gradual fade-out instead of instant reset
    timeline.to(mesh.morphTargetInfluences, {
        duration: duration * 0.1 / 1000,
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
