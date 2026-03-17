# Fish Value System

## Price Formula

```
baseWeight = round(displayedWeight / sizeMultiplier, 1)
correctedWeight = baseWeight * sizeMultiplier
Value = math.round(correctedWeight * basevalue * starMultiplier * mutationMultiplier)
```

## Star Quality

| Stars | Multiplier |
|-------|------------|
| Dead  | 0.2x       |
| 1     | 0.5x       |
| 2     | 0.75x      |
| 3     | 1.0x       |


## Fish Data Table

| Fish            | Rarity    | Base Value | Min Weight | Max Weight |
|-----------------|-----------|------------|------------|------------|
| Blue Tang       | Common    | 14         | 0.32kg     | 1.68kg     |
| Clownfish       | Common    | 12         | 0.8kg      | 3.36kg     |
| Pufferfish      | Uncommon  | 13         | 1.6kg      | 6.72kg     |
| Salmon          | Common    | 9          | 3.2kg      | 13.44kg    |
| Sea Horse       | Rare      | 250        | 0.4kg      | 1.68kg     |
| Piranha         | Rare      | 44         | 4kg        | 20.16kg    |
| Blobfish        | Rare      | 75         | 6.4kg      | 33.6kg     |
| Bluefin Tuna    | Legendary | 36         | 120kg      | 336kg      |
| Tang            | Common    | 12         | 0.32kg     | 1.68kg     |
| Lionfish        | Rare      | 20         | 1.6kg      | 11.75kg    |
| Mahi Mahi       | Rare      | 8          | 6.4kg      | 33.6kg     |
| Barracuda       | Epic      | 20         | 4.8kg      | 20.16kg    |
| Cod             | Uncommon  | 18         | 3.2kg      | 20.16kg    |
| Grouper         | Rare      | 28         | 4.8kg      | 23.52kg    |
| Scorpionfish    | Rare      | 60         | 3.2kg      | 13.44kg    |
| Blackfin Tuna   | Rare      | 60         | 4.8kg      | 26.88kg    |
| Cavefish        | Epic      | 22         | 24kg       | 134.4kg    |
| Shark           | Epic      | 40         | 16kg       | 117.6kg    |
| Bigmouthfish    | Legendary | 76         | 16kg       | 84kg       |
| Ancient Shark   | Legendary | 50         | 72kg       | 218.4kg    |
| Pompano         | Common    | 14         | 1.6kg      | 13.44kg    |
| Sunfish         | Rare      | 17         | 16kg       | 67.2kg     |
| Narwhal         | Rare      | 18         | 24kg       | 84kg       |
| Pacific Fanfish | Common    | 20         | 4kg        | 20.16kg    |
| Napoleon        | Uncommon  | 20         | 8kg        | 42kg       |
| Jellyfish       | Uncommon  | 35         | 3.2kg      | 16.8kg     |
| Sailfish        | Legendary | 40         | 24kg       | 100.8kg    |
| Hammer Shark    | Epic      | 48         | 32kg       | 134.4kg    |
| Eyefish         | Legendary | 160        | 16kg       | 75.6kg     |
| Anglerfish      | Rare      | 35         | 24kg       | 100.8kg    |
| Discus          | Common    | 25         | 4.8kg      | 23.52kg    |
| Tambaqui        | Uncommon  | 18         | 24kg       | 75.6kg     |
| Trout           | Uncommon  | 24         | 8kg        | 33.6kg     |
| Sea Turtle      | Rare      | 20         | 48kg       | 142.8kg    |
| Jaguar Shark    | Epic      | 50         | 56kg       | 184.8kg    |
| Toucan Fish     | Epic      | 90         | 20kg       | 67.2kg     |
| Sacabambaspis   | Legendary | 150        | 17.6g      | 70.56kg    |


## Mutations

| Mutation    | Price Mult | Size Mult |
|-------------|------------|-----------|
| Poop        | 0.33x      | 1.333x    |
| Rock        | 1x         | 1.2x      |
| Moss        | 1.1x       | 1x        |
| Coral       | 1.1x       | 0.8x      |
| Metal       | 1.2x       | 1.2x      |
| Sand        | 1.25x      | 1x        |
| Albino      | 1.3x       | 1x        |
| Transparent | 1.35x      | 1x        |
| Cactus      | 1.45x      | 1.3x      |
| Banana      | 1.5x       | 1x        |
| Spirit      | 1.7x       | 1.2x      |
| Fossil      | 1.75x      | 0.9x      |
| Golden      | 2x         | 1.2x      |
| Negative    | 2x         | 1x        |
| Fairy       | 2.3x       | 1.2x      |
| Invisible   | 2.4x       | 1.4x      |
| Liquid      | 2.5x       | 1.3x      |
| Grounded    | 2.8x       | 1.2x      |
| Neon        | 2.8x       | 1.2x      |
| Ultraviolet | 3.6x       | 1.8x      |
| Rooted      | 3.6x       | 1.5x      |
| Toxic       | 3.75x      | 1.2x      |
| Jade        | 4x         | 1x        |
| Cupid       | 1.4x       | 1x        |
| Lonely      | 2x         | 1x        |
| Shadow      | 6.66x      | 1.11x     |
| Angelic     | 7.77x      | 1.4x      |
| Abyssal     | 8.5x       | 1.5x      |