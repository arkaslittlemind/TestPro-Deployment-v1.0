import { PayloadDifference } from "../types/comparator.types";

export function generatePayloadDiff(
  muleData: any,
  sapData: any,
  currentPath: string = "",
): PayloadDifference[] {
  let differences: PayloadDifference[] = [];

  // Edge Case 1: Strictly handle nulls, as typeof null === 'object' in JS
  const isMuleNull = muleData === null;
  const isSapNull = sapData === null;

  if (isMuleNull && isSapNull) return differences;
  if (isMuleNull || isSapNull) {
    differences.push({
      path: currentPath || "root",
      type: "value_mismatch",
      muleValue: muleData,
      sapValue: sapData,
    });
    return differences;
  }

  // Edge Case 2: Primitive Types & Type Mismatches
  const muleType = typeof muleData;
  const sapType = typeof sapData;

  if (muleType !== sapType) {
    differences.push({
      path: currentPath || "root",
      type: "type_mismatch",
      muleValue: muleType === "undefined" ? undefined : muleData,
      sapValue: sapType === "undefined" ? undefined : sapData,
    });
    return differences;
  }

  // If they are primitives and match in type, compare values directly
  if (muleType !== "object") {
    if (muleData !== sapData) {
      differences.push({
        path: currentPath || "root",
        type: "value_mismatch",
        muleValue: muleData,
        sapValue: sapData,
      });
    }
    return differences;
  }

  // Edge Case 3: Arrays
  if (Array.isArray(muleData) && Array.isArray(sapData)) {
    const maxLength = Math.max(muleData.length, sapData.length);
    for (let i = 0; i < maxLength; i++) {
      const newPath = currentPath ? `${currentPath}[${i}]` : `[${i}]`;

      if (i >= sapData.length) {
        differences.push({
          path: newPath,
          type: "missing_in_sap",
          muleValue: muleData[i],
          sapValue: undefined,
        });
      } else if (i >= muleData.length) {
        differences.push({
          path: newPath,
          type: "missing_in_mule",
          muleValue: undefined,
          sapValue: sapData[i],
        });
      } else {
        differences.push(
          ...generatePayloadDiff(muleData[i], sapData[i], newPath),
        );
      }
    }
    return differences;
  }

  // Edge Case 4: Deep Objects
  const muleKeys = new Set(Object.keys(muleData));
  const sapKeys = new Set(Object.keys(sapData));
  const allKeys = new Set([...muleKeys, ...sapKeys]);

  allKeys.forEach((key) => {
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (!sapKeys.has(key)) {
      differences.push({
        path: newPath,
        type: "missing_in_sap",
        muleValue: muleData[key],
        sapValue: undefined,
      });
    } else if (!muleKeys.has(key)) {
      differences.push({
        path: newPath,
        type: "missing_in_mule",
        muleValue: undefined,
        sapValue: sapData[key],
      });
    } else {
      // Key exists in both, recursively check deeper
      differences.push(
        ...generatePayloadDiff(muleData[key], sapData[key], newPath),
      );
    }
  });

  return differences;
}
