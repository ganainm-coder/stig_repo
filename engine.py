
"""Starter calculations for the Pathfinder 2e Remaster builder.

This is demonstration code, not a complete or rules-validated PF2e engine.
"""

ANCESTRIES = {
    "Human": {"hp": 8},
    "Dwarf": {"hp": 10},
    "Elf": {"hp": 6},
}

CLASSES = {
    "Fighter": {"hp": 10},
    "Wizard": {"hp": 6},
    "Cleric": {"hp": 8},
    "Rogue": {"hp": 8},
}

ABILITIES = ("str", "dex", "con", "int", "wis", "cha")


def ability_modifier(score):
    """Calculate the standard ability modifier for a score."""
    return (int(score) - 10) // 2


def calculate_character(data):
    """Calculate a simple character summary from validated input."""
    name = str(data.get("name", "My Adventurer")).strip()[:80]
    ancestry_name = data.get("ancestry", "Human")
    class_name = data.get("character_class", "Fighter")
    background = str(data.get("background", "Scholar"))

    if ancestry_name not in ANCESTRIES:
        raise ValueError("Unsupported starter ancestry.")
    if class_name not in CLASSES:
        raise ValueError("Unsupported starter class.")

    level = int(data.get("level", 1))
    current_level = int(data.get("current_level", 1))
    workflow = data.get("workflow", "high-level")

    if not 1 <= level <= 20:
        raise ValueError("Target level must be between 1 and 20.")

    if workflow == "level-up":
        if not 1 <= current_level <= 20:
            raise ValueError("Current level must be between 1 and 20.")
        if level < current_level:
            raise ValueError("Target level cannot be below current level.")

    scores = {}
    modifiers = {}

    for ability in ABILITIES:
        score = int(data.get("abilities", {}).get(ability, 10))
        if not 8 <= score <= 24:
            raise ValueError(f"{ability.upper()} must be between 8 and 24.")
        scores[ability] = score
        modifiers[ability] = ability_modifier(score)

    ancestry_hp = ANCESTRIES[ancestry_name]["hp"]
    class_hp = CLASSES[class_name]["hp"]
    con_mod = modifiers["con"]

    # Demonstration formula; ancestry/class entries are only starter data.
    hp_at_level_1 = ancestry_hp + class_hp + con_mod
    total_hp = hp_at_level_1 + (level - 1) * (class_hp + con_mod)

    if workflow == "level-up":
        previous_hp = hp_at_level_1 + (current_level - 1) * (
            class_hp + con_mod
        )
        hp_gained = (level - current_level) * (class_hp + con_mod)
    else:
        previous_hp = None
        hp_gained = None

    return {
        "name": name or "My Adventurer",
        "level": level,
        "current_level": current_level if workflow == "level-up" else None,
        "workflow": workflow,
        "ancestry": ancestry_name,
        "character_class": class_name,
        "background": background,
        "abilities": scores,
        "modifiers": modifiers,
        "max_hp": total_hp,
        "previous_hp": previous_hp,
        "hp_gained": hp_gained,
        "rules_status": "Starter calculations only; not fully rules-validated.",
    }
