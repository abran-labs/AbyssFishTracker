import Tesseract from "tesseract.js";
import { FISH_SPECIES, MUTATIONS, STAR_LEVELS } from "./fish-config";

export interface OcrResult {
    fishName: string | null;
    weight: number | null;
    stars: number | null;
    mutation: string | null;
    rawText: string;
}

function similarity(a: string, b: string): number {
    const al = a.toLowerCase().trim();
    const bl = b.toLowerCase().trim();
    if (al === bl) return 1;
    if (al === "" || bl === "") return 0;
    if (al.includes(bl) || bl.includes(al)) return 0.9;

    // Character-level Dice coefficient
    const bigrams = (s: string) => {
        const set: string[] = [];
        for (let i = 0; i < s.length - 1; i++) set.push(s.slice(i, i + 2));
        return set;
    };
    const aBi = bigrams(al);
    const bBi = bigrams(bl);
    if (aBi.length === 0 || bBi.length === 0) return 0;
    let matches = 0;
    const used = new Set<number>();
    for (const ab of aBi) {
        for (let j = 0; j < bBi.length; j++) {
            if (!used.has(j) && ab === bBi[j]) {
                matches++;
                used.add(j);
                break;
            }
        }
    }
    return (2 * matches) / (aBi.length + bBi.length);
}

function bestMatch<T extends { name: string }>(
    text: string,
    items: T[],
    threshold = 0.5
): T | null {
    let best: T | null = null;
    let bestScore = threshold;

    for (const item of items) {
        const score = similarity(text, item.name);
        if (score > bestScore) {
            bestScore = score;
            best = item;
        }
    }
    return best;
}

function extractWeight(text: string): number | null {
    // Fix common OCR mistakes like 'O' instead of '0', or missing '.'
    const cleanText = text.replace(/O/g, "0").replace(/o/g, "0");

    // Match patterns like "36.0kg", "36.0 kg", "120kg", "36,0kg"
    const match = cleanText.match(/(\d+(?:[\.,]\d+)?)[\s]*k[gq]/i);
    if (match) {
        return parseFloat(match[1].replace(",", "."));
    }

    // Fallback: look for any number followed by "kg" even if there are weird chars between
    const fallbackMatch = cleanText.match(/(\d+(?:[\.,]\d+)?)[\s\S]{0,3}k[gq]/i);
    return fallbackMatch ? parseFloat(fallbackMatch[1].replace(",", ".")) : null;
}

function extractStars(text: string): number | null {
    const cleanText = text.replace(/O/g, "0").replace(/o/g, "0").replace(/z/gi, "2");

    // PRIORITY 1: Look for explicit dead fish keywords
    const lower = cleanText.toLowerCase();
    if (lower.includes("dead")) return 0;

    // PRIORITY 2: Look for explicit multipliers (OCR often drops decimal points or garbles parentheses)
    // Check 0.75 / 075 (2 stars)
    if (cleanText.includes("0.75") || cleanText.includes(".75") || cleanText.includes("075")) return 2;

    // Check 0.5 / 05 (1 star)
    if (cleanText.includes("0.5") || cleanText.includes(".5") || cleanText.match(/\(x?05\)/i) || cleanText.includes("05)")) return 1;

    // Check 0.2 / 02 (Dead / 0 stars)
    if (cleanText.includes("0.2") || cleanText.includes(".2") || cleanText.match(/\(x?02\)/i) || cleanText.includes("02)")) return 0;

    // Check (x1) or (x1.0) (3 stars)
    if (cleanText.match(/\([xX]?1(?:\.0)?\)/)) return 3;

    // PRIORITY 3: General multiplier float matching like (x1), (x0.75)
    // This serves as a secondary check if the above explicit ones didn't trigger
    const multMatch = cleanText.match(/\(x?([\d.]+)\)/i);
    if (multMatch) {
        for (const m of multMatch) {
            const valStr = m.replace(/[()xX]/g, "");
            const val = parseFloat(valStr);
            if (!isNaN(val)) {
                const star = STAR_LEVELS.find((s) => Math.abs(s.multiplier - val) < 0.01);
                if (star) return star.value;
            }
        }
    }

    // PRIORITY 4: Count actual clear star shapes (do NOT use * since OCR hallucinates it constantly)
    const starChars = text.match(/[★⭐✦✧☆]/g);
    if (starChars && starChars.length >= 1 && starChars.length <= 3) {
        return starChars.length;
    }

    // PRIORITY 5: Look for "3 star" or "2 star" string patterns
    const starNumMatch = cleanText.match(/(\d)\s*star/i);
    if (starNumMatch) {
        const n = parseInt(starNumMatch[1]);
        if (n >= 1 && n <= 3) return n;
    }

    return null;
}

function extractMutation(text: string): string | null {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Clean text for multiplier matching
    const cleanText = text.replace(/O/g, "0").replace(/o/g, "0").replace(/[xX≈=]/g, "");

    // Fallback: try matching multiplier from "(xN.N)" pattern
    for (const line of lines) {
        const cleanLine = line.replace(/O/g, "0").replace(/o/g, "0").replace(/z/gi, "2");

        // Look for numbers that resemble multipliers, like (x2.8), = (2.8), (x2.80)
        const multMatch = cleanLine.match(/[\(=]?\s*[xX]?(\d+[\.,]\d+)[\)]?/);
        if (multMatch) {
            const val = parseFloat(multMatch[1].replace(",", "."));
            // Ignore star multipliers (0.2, 0.5, 0.75, 1.0)
            if ([0.2, 0.5, 0.75, 1.0].includes(val)) continue;

            const mutation = MUTATIONS.find(
                (m) => Math.abs(m.multiplier - val) < 0.01
            );
            if (mutation) return mutation.name;
        }
    }

    // First, try the first line which typically has "MutationName (xN.N)"
    for (const line of lines) {
        // Try matching a mutation name directly
        const match = bestMatch(
            line.replace(/\(.*\)/, "").trim(),
            MUTATIONS.filter((m) => m.name !== "None"),
            0.6
        );
        if (match) return match.name;
    }

    // Aggressive multiplier scan across whole text
    for (const m of MUTATIONS) {
        if (m.name === "None" || [1.0, 0.5, 0.2, 0.75].includes(m.multiplier)) continue;
        if (cleanText.includes(m.multiplier.toString())) {
            return m.name;
        }
    }

    return null;
}

function extractFishName(text: string): string | null {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // The fish name is typically on its own line, try each line
    let best: { name: string; score: number } | null = null;

    for (const line of lines) {
        // Skip lines that look like weight, mutation multiplier, or description
        if (/\d+(\.\d+)?\s*kg/i.test(line)) continue;
        if (line.length > 40) continue; // Skip description text

        const match = bestMatch(line, FISH_SPECIES, 0.55);
        if (match) {
            const score = similarity(line, match.name);
            if (!best || score > best.score) {
                best = { name: match.name, score };
            }
        }
    }

    return best?.name ?? null;
}

// Shared worker instance
let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
    if (!workerPromise) {
        workerPromise = Tesseract.createWorker("eng", undefined, {
            logger: () => { },
        });
    }
    return workerPromise;
}

async function preprocessImage(imageSource: File | Blob | string): Promise<string | HTMLCanvasElement> {
    // If we're not in a browser environment, return as is
    if (typeof window === "undefined" || !document) return imageSource as any;

    // Load image into an Image object
    const img = new Image();
    img.crossOrigin = "Anonymous";
    const url = imageSource instanceof Blob ? URL.createObjectURL(imageSource) : imageSource;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
    });

    // Create an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;

    ctx.drawImage(img, 0, 0);

    // Apply image processing: grayscale and threshold/invert
    // The dark UI with bright text is hard for Tesseract, better to invert it
    try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Grayscale
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // Invert & threshold (make background white, text black)
            const val = avg > 80 ? 0 : 255;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas;
    } catch (e) {
        // If getImageData fails (e.g. CORS), fallback to original
        return url;
    }
}

export async function extractFishData(
    imageSource: File | Blob | string
): Promise<OcrResult> {
    const worker = await getWorker();

    // Run the original image, and a pre-processed (inverted) image,
    // since pre-processing helps numbers but might mess up colored names like Epic rarities.
    let input: string | File | Blob = imageSource;
    if (imageSource instanceof Blob && !(imageSource instanceof File)) {
        input = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(imageSource);
        });
    }

    const processedInput = await preprocessImage(imageSource);

    const [normalRun, processedRun] = await Promise.all([
        worker.recognize(input),
        worker.recognize(processedInput),
    ]);

    const rawNormal = normalRun.data.text.trim();
    const rawProcessed = processedRun.data.text.trim();
    const combinedText = rawNormal + "\n" + rawProcessed;

    const fishName = extractFishName(rawNormal) || extractFishName(rawProcessed);
    let weight = extractWeight(rawProcessed) || extractWeight(rawNormal);
    const stars = extractStars(rawNormal) || extractStars(rawProcessed);
    let mutation = extractMutation(rawNormal) || extractMutation(rawProcessed);

    // Nonsense blocking: if we can't find a fish name AND we can't find a weight,
    // this is probably not a screenshot of the fish info panel.
    if (!fishName && !weight) {
        throw new Error("Invalid screenshot: Could not detect any fish data.");
    }

    // Physical possibility checks
    if (fishName && weight) {
        const fishConfig = FISH_SPECIES.find(f => f.name === fishName);
        if (fishConfig) {
            // OCR sometimes misses the decimal point (e.g. 10.6 -> 106)
            if (weight > fishConfig.maxWeight * 2) {
                if (weight / 10 <= fishConfig.maxWeight && weight / 10 >= fishConfig.minWeight) {
                    weight = weight / 10;
                } else if (weight / 100 <= fishConfig.maxWeight && weight / 100 >= fishConfig.minWeight) {
                    weight = weight / 100;
                } else {
                    weight = null; // Unsalvageable
                }
            } else if (weight < fishConfig.minWeight / 2) {
                // Read 0.5 instead of 5.0
                if (weight * 10 <= fishConfig.maxWeight && weight * 10 >= fishConfig.minWeight) {
                    weight = weight * 10;
                }
            }
        }
    }

    // Ensure mutation is valid for the fish's areas
    if (fishName && mutation) {
        const fishConfig = FISH_SPECIES.find(f => f.name === fishName);
        if (fishConfig) {
            const mutConfig = MUTATIONS.find(m => m.name === mutation);
            // If mutation is area restricted, and the fish cannot be caught in that area
            if (mutConfig?.area && !fishConfig.areas.includes(mutConfig.area)) {
                mutation = null;
            }
        }
    }

    return {
        fishName,
        weight,
        stars,
        mutation,
        rawText: combinedText,
    };
}
