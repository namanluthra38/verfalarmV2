package com.verf.ProdExp.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum Unit {
    PIECES("pcs"),
    GRAM("g"),
    KILOGRAM("kg"),
    LITER("l"),
    MILLILITER("ml"),
    OUNCE("oz"),
    POUND("lb"),
    CUP("cup"),
    QUART("qt"),
    GALLON("gal"),
    BOTTLE("bottle"),
    BOX("box"),
    PACK("pack");

    private final String label;

    Unit(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static Unit fromValue(String value) {
        return Arrays.stream(Unit.values())
                .filter(u -> u.label.equalsIgnoreCase(value)
                        || u.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid unit: " + value));
    }
}
