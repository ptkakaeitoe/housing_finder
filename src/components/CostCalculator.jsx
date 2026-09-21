"use client";

import { useState } from "react";

export default function CostCalculator({
  rent,
  electricityRate,
  waterRate,
  wifiCost,
}) {
  const [electricityUnits, setElectricityUnits] =
    useState("");

  const [waterUnits, setWaterUnits] =
    useState("");

  if (
    rent == null ||
    electricityRate == null ||
    waterRate == null
  ) {
    return (
      <div className="cost-calculator">
        <h3>
          True Monthly Cost
        </h3>

        <p>
          Cost information will appear when
          property data is loaded.
        </p>
      </div>
    );
  }

  const electricity =
    Number(electricityUnits || 0) *
    Number(electricityRate);

  const water =
    Number(waterUnits || 0) *
    Number(waterRate);

  const total =
    Number(rent) +
    electricity +
    water +
    Number(wifiCost || 0);

  return (
    <div className="cost-calculator">
      <p className="page-eyebrow">
        COST CALCULATOR
      </p>

      <h3>
        True Monthly Cost
      </h3>

      <div className="calculator-input">
        <label>
          Electricity usage
        </label>

        <input
          type="number"
          placeholder="Enter units"
          value={electricityUnits}
          onChange={(event) =>
            setElectricityUnits(
              event.target.value
            )
          }
        />
      </div>

      <div className="calculator-input">
        <label>
          Water usage
        </label>

        <input
          type="number"
          placeholder="Enter units"
          value={waterUnits}
          onChange={(event) =>
            setWaterUnits(
              event.target.value
            )
          }
        />
      </div>

      <div className="calculator-total">
        <span>
          Estimated Monthly Cost
        </span>

        <strong>
          ฿{total.toLocaleString()}
        </strong>
      </div>
    </div>
  );
}
