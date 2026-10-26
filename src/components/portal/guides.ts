// Legal guides shown at /guias (ES) and /en/guias (EN). General information, reviewed by the legal team.
// Keep amounts hedged ("consulta el monto vigente") — they change by decree.

export interface GuideSection { h: string; p?: string[]; list?: string[] }
export interface GuideText { title: string; summary: string; sections: GuideSection[] }
export interface Guide { slug: string; minutes: number; img: string; es: GuideText; en: GuideText }

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=75`;

export const GUIDES: Guide[] = [
  {
    slug: "comprar-propiedad-en-panama-siendo-extranjero",
    minutes: 5,
    img: img("1582407947304-fd86f028f716"),
    es: {
      title: "Comprar propiedad en Panamá siendo extranjero",
      summary: "Los extranjeros pueden comprar con los mismos derechos que un panameño. Te explicamos el proceso paso a paso y qué revisar antes de pagar.",
      sections: [
        { h: "¿Puede un extranjero comprar?", p: [
          "Sí. La Constitución de Panamá reconoce a los extranjeros los mismos derechos de propiedad que a los nacionales. No necesitas residencia para comprar ni para inscribir la propiedad a tu nombre.",
          "Las excepciones principales son las tierras ubicadas cerca de las fronteras y algunos regímenes especiales en islas y zonas costeras, que conviene revisar con un abogado antes de negociar.",
        ] },
        { h: "El proceso de compra", list: [
          "Oferta y negociación del precio y las condiciones.",
          "Contrato de promesa de compraventa, normalmente con un abono inicial (es común un 10%).",
          "Debida diligencia: certificado del Registro Público (propietario, gravámenes, hipotecas), paz y salvo de impuesto de inmueble, IDAAN y cuotas de mantenimiento del PH.",
          "Escritura pública de compraventa firmada ante notario.",
          "Inscripción en el Registro Público: desde ese momento la propiedad es legalmente tuya.",
        ] },
        { h: "Cómo se protege el pago", p: [
          "Lo usual es que el saldo se pague contra la inscripción de la escritura, mediante una carta de compromiso bancaria (si hay hipoteca) o una cuenta de garantía (escrow). Así el vendedor cobra solo cuando la propiedad ya está a nombre del comprador.",
        ] },
        { h: "A tener en cuenta", list: [
          "Abrir una cuenta bancaria en Panamá siendo extranjero puede tomar varias semanas: empieza con tiempo.",
          "Muchos compradores adquieren a través de una sociedad anónima o una fundación de interés privado; cada opción tiene implicaciones fiscales y de sucesión distintas.",
          "Verifica siempre que la propiedad tenga título inscrito y no solo derechos posesorios.",
        ] },
      ],
    },
    en: {
      title: "Buying property in Panama as a foreigner",
      summary: "Foreigners can buy with the same rights as Panamanians. Here is the process step by step and what to check before you pay.",
      sections: [
        { h: "Can a foreigner buy?", p: [
          "Yes. Panama's Constitution grants foreigners the same property rights as nationals. You don't need residency to buy or to register the property in your name.",
          "The main exceptions are land near the borders and some special regimes on islands and coastal areas, which should be reviewed with an attorney before negotiating.",
        ] },
        { h: "The buying process", list: [
          "Offer and negotiation of price and terms.",
          "Promise-to-purchase agreement, usually with an initial deposit (10% is common).",
          "Due diligence: Public Registry certificate (owner, liens, mortgages), property-tax, water (IDAAN) and HOA clearance letters.",
          "Public deed of sale signed before a notary.",
          "Registration at the Public Registry: from then on the property is legally yours.",
        ] },
        { h: "How the payment is protected", p: [
          "The balance is usually paid against registration of the deed, through a bank letter of commitment (with a mortgage) or an escrow account. The seller only gets paid once the property is in the buyer's name.",
        ] },
        { h: "Keep in mind", list: [
          "Opening a bank account in Panama as a foreigner can take several weeks: start early.",
          "Many buyers purchase through a corporation or a private interest foundation; each option has different tax and estate implications.",
          "Always confirm the property has a registered title, not just possessory rights.",
        ] },
      ],
    },
  },
  {
    slug: "costos-de-cierre-al-comprar",
    minutes: 4,
    img: img("1560518883-ce09059eeffa"),
    es: {
      title: "Costos de cierre al comprar una propiedad",
      summary: "Además del precio, el comprador asume gastos legales, notariales, de registro y bancarios. Esto es lo que debes presupuestar.",
      sections: [
        { h: "Gastos que suele pagar el comprador", list: [
          "Honorarios legales por la revisión de documentos y la escritura (varían según el valor y la complejidad).",
          "Gastos notariales y derechos de inscripción en el Registro Público, que se calculan sobre el valor de la operación.",
          "Si hay hipoteca: avalúo, comisión de manejo del banco, gastos de la escritura de hipoteca y seguros de vida e incendio.",
          "Cuotas de mantenimiento proporcionales y depósitos de servicios al recibir la propiedad.",
        ] },
        { h: "Gastos que suele pagar el vendedor", list: [
          "Impuesto de transferencia de bienes inmuebles (2%).",
          "Adelanto del impuesto sobre la renta por ganancia de capital (3%).",
          "Comisión del corredor inmobiliario, según lo pactado.",
          "Cancelación de hipotecas o gravámenes existentes.",
        ] },
        { h: "Cuánto reservar", p: [
          "Como referencia, muchos compradores reservan entre el 2% y el 4% del precio para cubrir los gastos de cierre, según si compran con hipoteca o de contado. Pide siempre un desglose por escrito antes de firmar la promesa.",
        ] },
        { h: "Intereses preferenciales", p: [
          "Las viviendas nuevas dentro de ciertos rangos de precio pueden acceder al régimen de intereses preferenciales, que reduce la cuota mensual. Los rangos y beneficios los fija la ley y cambian; consúltanos si aplica a la propiedad que te interesa.",
        ] },
      ],
    },
    en: {
      title: "Closing costs when buying property",
      summary: "On top of the price, the buyer covers legal, notary, registration and bank costs. Here is what to budget for.",
      sections: [
        { h: "Costs usually paid by the buyer", list: [
          "Legal fees for document review and the deed (they vary with value and complexity).",
          "Notary fees and Public Registry registration fees, calculated on the transaction value.",
          "With a mortgage: appraisal, bank handling fee, mortgage deed costs and life and fire insurance.",
          "Prorated HOA fees and utility deposits when you receive the property.",
        ] },
        { h: "Costs usually paid by the seller", list: [
          "Real estate transfer tax (2%).",
          "Capital gains income tax advance (3%).",
          "The real estate broker's commission, as agreed.",
          "Release of any existing mortgages or liens.",
        ] },
        { h: "How much to set aside", p: [
          "As a reference, many buyers set aside between 2% and 4% of the price for closing costs, depending on whether they buy with a mortgage or in cash. Always ask for a written breakdown before signing the promise agreement.",
        ] },
        { h: "Preferential interest", p: [
          "New homes within certain price ranges may qualify for the preferential interest regime, which lowers the monthly payment. Ranges and benefits are set by law and change; ask us whether it applies to the property you like.",
        ] },
      ],
    },
  },
  {
    slug: "impuestos-al-vender-una-propiedad",
    minutes: 4,
    img: img("1554224155-6726b3ff858f"),
    es: {
      title: "Impuestos al vender una propiedad en Panamá",
      summary: "Al vender pagas el impuesto de transferencia y el impuesto sobre la ganancia de capital. Te explicamos cómo se calculan.",
      sections: [
        { h: "Impuesto de transferencia (2%)", p: [
          "Se paga el 2% sobre el mayor entre el precio de venta y el valor catastral actualizado de la propiedad. Normalmente lo asume el vendedor y debe estar pagado antes de inscribir la escritura.",
        ] },
        { h: "Ganancia de capital", p: [
          "La ganancia (precio de venta menos el costo de adquisición y mejoras documentadas) paga un 10% de impuesto sobre la renta.",
          "Al vender, se adelanta un 3% sobre el mayor entre el precio de venta y el valor catastral. Ese 3% puede tomarse como pago definitivo; si es mayor que el 10% de la ganancia real, el vendedor puede gestionar la diferencia ante la DGI.",
        ] },
        { h: "Impuesto de inmueble", p: [
          "Mientras eres dueño pagas el impuesto de inmueble anual. La vivienda principal registrada como tal tiene una exención sobre los primeros tramos de valor y tasas progresivas por encima; las demás propiedades pagan tasas progresivas según su valor catastral.",
          "Para vender necesitas el paz y salvo de este impuesto.",
        ] },
        { h: "Antes de poner en venta", list: [
          "Reúne la escritura de compra y los comprobantes de mejoras: reducen la ganancia gravable.",
          "Solicita el certificado del Registro Público para detectar gravámenes a tiempo.",
          "Si hay hipoteca, pide al banco la carta de saldo para cancelarla al cierre.",
        ] },
      ],
    },
    en: {
      title: "Taxes when selling property in Panama",
      summary: "When you sell you pay the transfer tax and the capital gains tax. Here is how they are calculated.",
      sections: [
        { h: "Transfer tax (2%)", p: [
          "2% is paid on the higher of the sale price and the property's updated cadastral value. The seller usually pays it, and it must be paid before the deed is registered.",
        ] },
        { h: "Capital gains", p: [
          "The gain (sale price minus purchase cost and documented improvements) pays 10% income tax.",
          "At the sale, 3% of the higher of the sale price and the cadastral value is paid in advance. That 3% can be taken as the final payment; if it exceeds 10% of the actual gain, the seller can claim the difference with the tax authority (DGI).",
        ] },
        { h: "Annual property tax", p: [
          "While you own it you pay annual property tax. A registered primary residence is exempt on the first value bracket and pays progressive rates above it; other properties pay progressive rates on their cadastral value.",
          "You need a property-tax clearance letter to sell.",
        ] },
        { h: "Before listing", list: [
          "Gather your purchase deed and receipts for improvements: they reduce the taxable gain.",
          "Request the Public Registry certificate to spot liens early.",
          "If there is a mortgage, ask the bank for the payoff letter to release it at closing.",
        ] },
      ],
    },
  },
  {
    slug: "residencia-en-panama-por-pension-o-inversion",
    minutes: 5,
    img: img("1500530855697-b586d89ba3ee"),
    es: {
      title: "Residencia en Panamá por pensión o inversión inmobiliaria",
      summary: "Panamá ofrece visas de residencia para jubilados y para quienes invierten en bienes raíces. Estas son las opciones más usadas.",
      sections: [
        { h: "Visa de Pensionado", p: [
          "Pensada para jubilados con una pensión vitalicia. El requisito habitual es una pensión mínima mensual (con un monto menor si además compras una propiedad en Panamá por encima de cierto valor).",
          "Da acceso a descuentos de ley en salud, transporte, entretenimiento y servicios.",
        ] },
        { h: "Países Amigos", p: [
          "Para ciudadanos de los países de la lista oficial. Además de la nacionalidad, exige un vínculo económico con Panamá, por ejemplo un empleo o la compra de una propiedad por un monto mínimo.",
        ] },
        { h: "Inversionista Calificado", p: [
          "Residencia permanente por una inversión de alto monto, que puede hacerse en bienes raíces. Es la vía más rápida, pero exige el mayor capital y que la inversión se mantenga por un plazo mínimo.",
        ] },
        { h: "Cómo te ayudamos", list: [
          "Encontramos una propiedad que cumpla el monto y las condiciones de la visa.",
          "Nuestra abogada prepara el expediente y te acompaña ante Migración.",
          "Los montos y requisitos los fija Migración y cambian con frecuencia: confirmamos los vigentes antes de que compres.",
        ] },
      ],
    },
    en: {
      title: "Panama residency through pension or real estate investment",
      summary: "Panama offers residency visas for retirees and for real estate investors. These are the most common options.",
      sections: [
        { h: "Pensionado visa", p: [
          "Designed for retirees with a lifetime pension. The usual requirement is a minimum monthly pension (lower if you also buy property in Panama above a certain value).",
          "It gives access to legal discounts on healthcare, transport, entertainment and services.",
        ] },
        { h: "Friendly Nations", p: [
          "For citizens of countries on the official list. Besides nationality, it requires an economic tie to Panama, such as a job or a property purchase above a minimum amount.",
        ] },
        { h: "Qualified Investor", p: [
          "Permanent residency for a high-value investment, which can be in real estate. It is the fastest route, but requires the most capital and keeping the investment for a minimum period.",
        ] },
        { h: "How we help", list: [
          "We find a property that meets the visa's amount and conditions.",
          "Our attorney prepares the file and goes with you to Immigration.",
          "Amounts and requirements are set by Immigration and change often: we confirm the current ones before you buy.",
        ] },
      ],
    },
  },
  {
    slug: "alquilar-en-panama-contrato-y-requisitos",
    minutes: 4,
    img: img("1522708323590-d24dbb6b0267"),
    es: {
      title: "Alquilar en Panamá: contrato, depósito y requisitos",
      summary: "Qué te van a pedir para alquilar, qué debe decir el contrato y cómo proteger tu depósito, seas inquilino o propietario.",
      sections: [
        { h: "Lo que suelen pedir al inquilino", list: [
          "Cédula o pasaporte.",
          "Carta de trabajo o prueba de ingresos (estados de cuenta, declaración de renta).",
          "Depósito de garantía (comúnmente un mes) y el primer mes por adelantado.",
        ] },
        { h: "Qué debe incluir el contrato", list: [
          "Canon mensual, fecha de pago y penalidad por atraso.",
          "Plazo, renovación y condiciones de aumento.",
          "Quién paga el mantenimiento del PH, los servicios y las reparaciones.",
          "Inventario y estado de la propiedad al entregarla, con fotos.",
          "Causales de terminación anticipada y su penalidad.",
          "Reglas sobre mascotas, subarriendo y uso de áreas comunes.",
        ] },
        { h: "El depósito de garantía", p: [
          "Sirve para cubrir daños o deudas al terminar el contrato, no para pagar el último mes. Al salir, se devuelve tras revisar la propiedad contra el inventario inicial; por eso es clave documentar bien la entrega.",
        ] },
        { h: "Si eres propietario", p: [
          "Te ayudamos a filtrar inquilinos, redactar el contrato y administrar la propiedad (cobros, mantenimiento e informes). Un contrato bien hecho evita la mayoría de los conflictos.",
        ] },
      ],
    },
    en: {
      title: "Renting in Panama: lease, deposit and requirements",
      summary: "What you will be asked for, what the lease should say and how to protect the deposit, whether you are a tenant or a landlord.",
      sections: [
        { h: "What tenants are usually asked for", list: [
          "ID card or passport.",
          "Employment letter or proof of income (bank statements, tax return).",
          "Security deposit (commonly one month) and the first month in advance.",
        ] },
        { h: "What the lease should include", list: [
          "Monthly rent, due date and late-payment penalty.",
          "Term, renewal and rent increase conditions.",
          "Who pays HOA fees, utilities and repairs.",
          "Inventory and condition of the property at handover, with photos.",
          "Early termination grounds and penalty.",
          "Rules on pets, subletting and common areas.",
        ] },
        { h: "The security deposit", p: [
          "It covers damage or debts at the end of the lease, not the last month's rent. When you move out it is returned after checking the property against the initial inventory, which is why documenting the handover matters.",
        ] },
        { h: "If you are a landlord", p: [
          "We help you screen tenants, draft the lease and manage the property (collections, maintenance and reports). A well-written lease prevents most disputes.",
        ] },
      ],
    },
  },
  {
    slug: "titulo-de-propiedad-vs-derechos-posesorios",
    minutes: 4,
    img: img("1500382017468-9049fed747ef"),
    es: {
      title: "Título de propiedad vs. derechos posesorios",
      summary: "En playas y en el interior se venden muchos terrenos con derechos posesorios. Te explicamos la diferencia y los riesgos.",
      sections: [
        { h: "Título de propiedad", p: [
          "Es la propiedad plena, inscrita en el Registro Público con un número de finca. Se puede vender, hipotecar y heredar con total seguridad jurídica, y los bancos la aceptan como garantía.",
        ] },
        { h: "Derechos posesorios", p: [
          "Es la posesión de un terreno sin título inscrito: quien lo ocupa tiene derecho a usarlo y a solicitar su titulación, pero no es dueño registrado. Es común en zonas rurales y costeras.",
          "Los bancos normalmente no financian estas propiedades y la compra depende de documentos privados, por lo que el riesgo de conflictos con vecinos o terceros es mayor.",
        ] },
        { h: "¿Se puede titular?", p: [
          "En muchos casos sí, mediante un trámite ante la Autoridad Nacional de Administración de Tierras (ANATI) con planos, inspección y publicaciones. Puede tomar meses y no todas las tierras son titulables (por ejemplo, playas, manglares y otras áreas de dominio público).",
        ] },
        { h: "Antes de comprar un terreno", list: [
          "Pide el número de finca y verifica el certificado en el Registro Público.",
          "Si son derechos posesorios, revisa la cadena de documentos, el plano y la situación ante ANATI.",
          "Confirma accesos, servidumbres y que el terreno no esté en zona de dominio público o protegida.",
        ] },
      ],
    },
    en: {
      title: "Titled property vs. possessory rights",
      summary: "Many beach and countryside lots are sold with possessory rights. Here is the difference and the risks.",
      sections: [
        { h: "Titled property", p: [
          "Full ownership registered at the Public Registry under a property number (finca). It can be sold, mortgaged and inherited with full legal certainty, and banks accept it as collateral.",
        ] },
        { h: "Possessory rights", p: [
          "Possession of land without a registered title: the occupant may use it and apply for title, but is not the registered owner. It is common in rural and coastal areas.",
          "Banks usually don't finance these properties and the purchase relies on private documents, so the risk of disputes with neighbors or third parties is higher.",
        ] },
        { h: "Can it be titled?", p: [
          "Often yes, through a process with the National Land Administration Authority (ANATI) involving surveys, inspection and public notices. It can take months, and not all land can be titled (for example beaches, mangroves and other public-domain areas).",
        ] },
        { h: "Before buying land", list: [
          "Ask for the finca number and check the certificate at the Public Registry.",
          "With possessory rights, review the chain of documents, the survey and the status with ANATI.",
          "Confirm access, easements and that the land is not in a public-domain or protected area.",
        ] },
      ],
    },
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug) || null;
