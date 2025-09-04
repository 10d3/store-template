export const femmeFlowData = {
  // Product Header
  productHeader: {
    title: "FemmeFlow – Supplement Facts & Usage",
    icon: "💊",
  },

  // Product Details
  productDetails: [
    {
      label: "Manufacturer's Country",
      value: "USA",
      bold: false,
    },
    {
      label: "Product Amount",
      value: "60 capsules / 1.6 oz / 0.1 lb / 46 g",
      bold: false,
    },
    {
      label: "Gross Weight",
      value: "2.36 oz / 0.15 lb / 67 g",
      bold: false,
    },
  ],

  // Active Ingredients (for nutritional table)
  activeIngredients: [
    {
      name: "Soy Isoflavones",
      amount: "30 mg",
      percentage: null,
      isHeader: true,
    },
    {
      name: "Black Cohosh Root Extract",
      amount: "160 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Dong Quai Root Extract (1%)",
      amount: "150 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Licorice Root Extract (1%)",
      amount: "150 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Red Clover Aerial Parts Extract (1%)",
      amount: "400 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Sage Leaf Extract (2.5%)",
      amount: "200 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Chasteberry Fruit Extract (0.5%)",
      amount: "50 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Blessed Thistle Herb Powder",
      amount: "50 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Red Raspberry Fruit Powder",
      amount: "50 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "Wild Yam Root Extract (16%)",
      amount: "15 mg",
      percentage: null,
      isHeader: false,
    },
    {
      name: "trans-Resveratrol (from Polygonum cuspidatum Root Extract)",
      amount: "1 mg",
      percentage: null,
      isHeader: false,
    },
  ],

  // Complete Ingredients List
  ingredientsList:
    "Soy Isoflavones (30 mg), Black Cohosh Root Extract (160 mg), Dong Quai Root Extract (1%) (150 mg), Licorice Root Extract (1%) (150 mg), Red Clover Aerial Parts Extract (1%) (400 mg), Sage Leaf Extract (2.5%) (200 mg), Chasteberry Fruit Extract (0.5%) (50 mg), Blessed Thistle Herb Powder (50 mg), Red Raspberry Fruit Powder (50 mg), Wild Yam Root Extract (16%) (15 mg), trans-Resveratrol (from Polygonum cuspidatum Root Extract) (1 mg), Gelatin (bovine), Microcrystalline Cellulose, Vegetable Magnesium Stearate, Silicon Dioxide.",

  // Other Ingredients (inactive)
  otherIngredients: [
    "Gelatin (bovine)",
    "Microcrystalline Cellulose",
    "Vegetable Magnesium Stearate",
    "Silicon Dioxide",
  ],

  // Usage Instructions
  usageInstructions: {
    dailyDose: "Take 2 (two) capsules daily",
    instructions:
      "preferably with meals or as directed by a healthcare professional.",
  },

  // Allergen Information
  allergenInfo: {
    allergens:
      "This product is manufactured and packaged in a facility which may also process milk, soy, wheat, egg, peanuts, tree nuts, fish, and crustacean shellfish.",
    registrationCode: null,
  },

  // Warnings and Cautions
  warnings: {
    sections: [
      {
        title: "Caution",
        content:
          "Do not exceed recommended dose. Pregnant or nursing mothers, children under the age of 18, and individuals with a known medical condition should consult a physician before using this or any dietary supplement. This product is manufactured and packaged in a facility which may also process milk, soy, wheat, egg, peanuts, tree nuts, fish, and crustacean shellfish.",
      },
      {
        title: "Warning",
        content:
          "KEEP OUT OF THE REACH OF CHILDREN. DO NOT USE IF SAFETY SEAL IS DAMAGED OR MISSING. STORE IN A COOL, DRY PLACE.",
      },
      {
        title: "FDA Disclaimer",
        content:
          "*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.*",
        isItalic: true,
      },
    ],
  },

  // Tab Navigation Options
  tabNavigation: {
    activeTab: "Supplement Facts",
    tabs: ["Supplement Facts", "Per Serving", "Daily Value"],
  },
};

export const usageExample = `
<SupplementPanel>
  <ProductHeader title="FemmeFlow" />
  <SupplementLayout>
    <MainInfo>
      <NutritionalTable>
        <NutrientRow name="Ingredients" amount="Per Serving (2 Capsules)" isHeader={true} />
        <NutrientRow name="Soy Isoflavones" amount="30 mg" />
        <NutrientRow name="Black Cohosh Root Extract" amount="160 mg" />
        <NutrientRow name="Dong Quai Root Extract (1%)" amount="150 mg" />
        <NutrientRow name="Licorice Root Extract (1%)" amount="150 mg" />
        <NutrientRow name="Red Clover Aerial Parts Extract (1%)" amount="400 mg" />
        <NutrientRow name="Sage Leaf Extract (2.5%)" amount="200 mg" />
        <NutrientRow name="Chasteberry Fruit Extract (0.5%)" amount="50 mg" />
        <NutrientRow name="Blessed Thistle Herb Powder" amount="50 mg" />
        <NutrientRow name="Red Raspberry Fruit Powder" amount="50 mg" />
        <NutrientRow name="Wild Yam Root Extract (16%)" amount="15 mg" />
        <NutrientRow name="trans-Resveratrol (from Polygonum cuspidatum Root Extract)" amount="1 mg" />
      </NutritionalTable>
      <ReferenceNotes>
        <p>Other Ingredients: Gelatin (bovine), Microcrystalline Cellulose, Vegetable Magnesium Stearate, Silicon Dioxide.</p>
      </ReferenceNotes>
    </MainInfo>
    <AdditionalInfo>
      <ProductDetails>
        <DetailRow label="Product Amount" value="60 capsules" />
        <DetailRow label="Gross Weight" value="2.36 oz (67 g)" />
        <DetailRow label="Manufacturer's Country" value="USA" />
      </ProductDetails>
      <UsageInstructions
        dailyDose="2 (two) capsules daily"
        instructions="Take preferably with meals or as directed by a healthcare professional."
      />
      <WarningsSection>
        <p>Do not exceed recommended dose. Pregnant or nursing mothers, children under the age of 18, and individuals with a known medical condition should consult a physician before using this or any dietary supplement.</p>
        <p>**WARNING:** KEEP OUT OF THE REACH OF CHILDREN. DO NOT USE IF SAFETY SEAL IS DAMAGED OR MISSING. STORE IN A COOL, DRY PLACE.</p>
      </WarningsSection>
      <AllergenInfo
        allergens="This product is manufactured and packaged in a facility which may also process milk, soy, wheat, egg, peanuts, tree nuts, fish, and crustacean shellfish."
      />
      <ReferenceNotes>
        <p>These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
      </ReferenceNotes>
    </AdditionalInfo>
  </SupplementLayout>
</SupplementPanel>
`;
