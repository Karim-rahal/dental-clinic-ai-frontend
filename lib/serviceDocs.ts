export interface DocItem {
  id: string;
  label: string;
  hint: string;
}

export interface DocSection {
  section: string;
  iconType: "xray" | "photo" | "doc";
  color: string;
  iconColor: string;
  desc: string;
  required: boolean;
  items: DocItem[];
}

export const SERVICE_DOCS: Record<string, DocSection[]> = {
  "Dental Checkup": [
    {
      section: "Full Mouth X-rays",
      iconType: "xray",
      color: "#E6F1FB",
      iconColor: "#185FA5",
      desc: "Panoramic + bitewing series",
      required: true,
      items: [
        {
          id: "dc1",
          label: "Panoramic X-ray (OPG)",
          hint: "Full arch view from ear to ear",
        },
        {
          id: "dc2",
          label: "Bitewing X-rays (Left + Right)",
          hint: "Posterior regions — cavity detection",
        },
        {
          id: "dc3",
          label: "Periapical series (if available)",
          hint: "Any single-tooth films from prior visits",
        },
      ],
    },
    {
      section: "Medical History",
      iconType: "doc",
      color: "#FAEEDA",
      iconColor: "#854F0B",
      desc: "Health notes & medications",
      required: false,
      items: [
        {
          id: "dc4",
          label: "Previous dental notes or referral",
          hint: "From prior clinic if applicable",
        },
      ],
    },
  ],

  "Teeth Cleaning": [
    {
      section: "X-ray (First Visit)",
      iconType: "xray",
      color: "#E6F1FB",
      iconColor: "#185FA5",
      desc: "Panoramic if new patient",
      required: false,
      items: [
        {
          id: "tc1",
          label: "Panoramic X-ray (if first visit)",
          hint: "Skip if you've had one within the past 12 months",
        },
      ],
    },
    {
      section: "Previous Records",
      iconType: "doc",
      color: "#FAEEDA",
      iconColor: "#854F0B",
      desc: "Cleaning history",
      required: false,
      items: [
        {
          id: "tc2",
          label: "Last cleaning records / perio chart",
          hint: "Helps compare gum recession & pocket depths",
        },
      ],
    },
  ],

  "Dental Filling": [
    {
      section: "X-rays – Affected Area",
      iconType: "xray",
      color: "#E6F1FB",
      iconColor: "#185FA5",
      desc: "Periapical + bitewing",
      required: true,
      items: [
        {
          id: "df1",
          label: "Periapical X-ray – affected tooth",
          hint: "Shows root and surrounding bone",
        },
        {
          id: "df2",
          label: "Bitewing X-ray – affected region",
          hint: "Shows interproximal decay clearly",
        },
      ],
    },
  ],

  "Teeth Whitening": [
    {
      section: "Smile Photos",
      iconType: "photo",
      color: "#E1F5EE",
      iconColor: "#0F6E56",
      desc: "Current shade documentation",
      required: true,
      items: [
        {
          id: "tw1",
          label: "Frontal smile photo",
          hint: "Natural lighting — no filter",
        },
        {
          id: "tw2",
          label: "Close-up of teeth (retracted)",
          hint: "Use cheek retractors if available",
        },
        {
          id: "tw3",
          label: "Current shade guide photo",
          hint: "Hold shade tab next to teeth if available",
        },
      ],
    },
  ],

  "Braces Consultation": [
    {
      section: "Panoramic & Cephalometric X-rays",
      iconType: "xray",
      color: "#E6F1FB",
      iconColor: "#185FA5",
      desc: "Full arch + lateral skull profile",
      required: true,
      items: [
        {
          id: "bc1",
          label: "Panoramic X-ray (OPG)",
          hint: "Full jaw view from ear to ear",
        },
        {
          id: "bc2",
          label: "Lateral cephalometric X-ray",
          hint: "Side skull profile — essential for treatment planning",
        },
      ],
    },
    {
      section: "Intraoral Photos",
      iconType: "photo",
      color: "#E1F5EE",
      iconColor: "#0F6E56",
      desc: "Front & side bite photos",
      required: true,
      items: [
        {
          id: "bc3",
          label: "Front bite photo",
          hint: "Teeth closed, front-facing",
        },
        {
          id: "bc4",
          label: "Side bite photo (Left + Right)",
          hint: "Occlusion visible from both sides",
        },
        {
          id: "bc5",
          label: "Upper arch occlusal photo",
          hint: "Camera angled into open mouth, upper arch",
        },
        {
          id: "bc6",
          label: "Lower arch occlusal photo",
          hint: "Camera angled into open mouth, lower arch",
        },
      ],
    },
    {
      section: "Face Photos",
      iconType: "photo",
      color: "#FBEAF0",
      iconColor: "#993556",
      desc: "Profile & frontal smile",
      required: true,
      items: [
        {
          id: "bc7",
          label: "Frontal face – neutral expression",
          hint: "Natural lighting, no makeup ideal",
        },
        {
          id: "bc8",
          label: "Profile face – left side",
          hint: "Lips relaxed, ears visible",
        },
        {
          id: "bc9",
          label: "Smile photo",
          hint: "Wide smile showing full upper arch",
        },
      ],
    },
  ],

  "Root Canal": [
    {
      section: "Periapical X-ray",
      iconType: "xray",
      color: "#E6F1FB",
      iconColor: "#185FA5",
      desc: "Affected tooth region",
      required: true,
      items: [
        {
          id: "rc1",
          label: "Periapical X-ray – affected tooth",
          hint: "Single tooth view, root clearly visible",
        },
        {
          id: "rc2",
          label: "CBCT scan (3D cone beam)",
          hint: "If available from a previous provider",
        },
      ],
    },
    {
      section: "Clinical Records",
      iconType: "doc",
      color: "#FAEEDA",
      iconColor: "#854F0B",
      desc: "Prior treatment notes",
      required: false,
      items: [
        {
          id: "rc3",
          label: "Previous root canal records",
          hint: "Prior treatment notes or referral letter",
        },
        {
          id: "rc4",
          label: "Pain / symptom diary",
          hint: "Optional but helps diagnosis",
        },
      ],
    },
  ],
};