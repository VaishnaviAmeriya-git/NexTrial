/**
 * NexTrial CodingService
 * 
 * Provides terminology coding behind a pluggable interface.
 * Uses synthetic/demo dictionaries labeled "DEMO DICTIONARY" for MedDRA and Ayurvedic formulations.
 * Do not embed or fabricate real proprietary MedDRA/WHODrug files.
 */

// ~80 MedDRA-style SOC to PT terms labeled DEMO DICTIONARY
const DEMO_MEDDRA_DICTIONARY = [
  // Gastrointestinal disorders (SOC: 10017947)
  { soc: 'Gastrointestinal disorders', pt: 'Nausea', code: 'DEMO-10028813' },
  { soc: 'Gastrointestinal disorders', pt: 'Vomiting', code: 'DEMO-10047340' },
  { soc: 'Gastrointestinal disorders', pt: 'Dyspepsia', code: 'DEMO-10013946' },
  { soc: 'Gastrointestinal disorders', pt: 'Abdominal pain upper', code: 'DEMO-10000081' },
  { soc: 'Gastrointestinal disorders', pt: 'Gastric irritation', code: 'DEMO-10017849' },
  { soc: 'Gastrointestinal disorders', pt: 'Diarrhoea', code: 'DEMO-10012735' },
  { soc: 'Gastrointestinal disorders', pt: 'Constipation', code: 'DEMO-10010774' },
  { soc: 'Gastrointestinal disorders', pt: 'Flatulence', code: 'DEMO-10016766' },
  { soc: 'Gastrointestinal disorders', pt: 'Gastrooesophageal reflux disease', code: 'DEMO-10017885' },
  { soc: 'Gastrointestinal disorders', pt: 'Gastritis', code: 'DEMO-10017853' },
  { soc: 'Gastrointestinal disorders', pt: 'Gastric ulcer haemorrhage', code: 'DEMO-10017865' },

  // Musculoskeletal and connective tissue disorders (SOC: 10028395)
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Arthralgia', code: 'DEMO-10003239' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Joint swelling', code: 'DEMO-10023232' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Joint stiffness', code: 'DEMO-10023226' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Myalgia', code: 'DEMO-10028411' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Muscle spasms', code: 'DEMO-10028334' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Back pain', code: 'DEMO-10003988' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Osteoarthritis worsening', code: 'DEMO-10031174' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Tendonitis', code: 'DEMO-10043238' },
  { soc: 'Musculoskeletal and connective tissue disorders', pt: 'Pain in extremity', code: 'DEMO-10033425' },

  // Nervous system disorders (SOC: 10029205)
  { soc: 'Nervous system disorders', pt: 'Headache', code: 'DEMO-10019211' },
  { soc: 'Nervous system disorders', pt: 'Dizziness', code: 'DEMO-10013573' },
  { soc: 'Nervous system disorders', pt: 'Somnolence', code: 'DEMO-10041349' },
  { soc: 'Nervous system disorders', pt: 'Tremor', code: 'DEMO-10044565' },
  { soc: 'Nervous system disorders', pt: 'Paraesthesia', code: 'DEMO-10033775' },
  { soc: 'Nervous system disorders', pt: 'Lethargy', code: 'DEMO-10024264' },
  { soc: 'Nervous system disorders', pt: 'Migraine', code: 'DEMO-10027599' },
  { soc: 'Nervous system disorders', pt: 'Syncope', code: 'DEMO-10042772' },

  // Skin and subcutaneous tissue disorders (SOC: 10040785)
  { soc: 'Skin and subcutaneous tissue disorders', pt: 'Pruritus', code: 'DEMO-10037087' },
  { soc: 'Skin and subcutaneous tissue disorders', pt: 'Rash maculo-papular', code: 'DEMO-10037868' },
  { soc: 'Skin and subcutaneous tissue disorders', pt: 'Urticaria', code: 'DEMO-10046735' },
  { soc: 'Skin and subcutaneous tissue disorders', pt: 'Erythema', code: 'DEMO-10015150' },
  { soc: 'Skin and subcutaneous tissue disorders', pt: 'Dry skin', code: 'DEMO-10013786' },
  { soc: 'Skin and subcutaneous tissue disorders', pt: 'Hyperhidrosis', code: 'DEMO-10020642' },
  { soc: 'Skin and subcutaneous tissue disorders', pt: 'Contact dermatitis', code: 'DEMO-10010741' },

  // General disorders and administration site conditions (SOC: 10018065)
  { soc: 'General disorders and administration site conditions', pt: 'Pyrexia', code: 'DEMO-10037660' },
  { soc: 'General disorders and administration site conditions', pt: 'Fatigue', code: 'DEMO-10016256' },
  { soc: 'General disorders and administration site conditions', pt: 'Asthenia', code: 'DEMO-10003549' },
  { soc: 'General disorders and administration site conditions', pt: 'Oedema peripheral', code: 'DEMO-10030095' },
  { soc: 'General disorders and administration site conditions', pt: 'Application site pruritus', code: 'DEMO-10003043' },
  { soc: 'General disorders and administration site conditions', pt: 'Application site erythema', code: 'DEMO-10003024' },
  { soc: 'General disorders and administration site conditions', pt: 'Chest pain', code: 'DEMO-10008479' },

  // Metabolism and nutrition disorders (SOC: 10027433)
  { soc: 'Metabolism and nutrition disorders', pt: 'Decreased appetite', code: 'DEMO-10061428' },
  { soc: 'Metabolism and nutrition disorders', pt: 'Hypoglycaemia', code: 'DEMO-10020993' },
  { soc: 'Metabolism and nutrition disorders', pt: 'Hyperglycaemia', code: 'DEMO-10020635' },
  { soc: 'Metabolism and nutrition disorders', pt: 'Weight increased', code: 'DEMO-10047899' },
  { soc: 'Metabolism and nutrition disorders', pt: 'Polydipsia', code: 'DEMO-10036076' },

  // Respiratory, thoracic and mediastinal disorders (SOC: 10038738)
  { soc: 'Respiratory, thoracic and mediastinal disorders', pt: 'Cough', code: 'DEMO-10011224' },
  { soc: 'Respiratory, thoracic and mediastinal disorders', pt: 'Dyspnoea', code: 'DEMO-10013968' },
  { soc: 'Respiratory, thoracic and mediastinal disorders', pt: 'Pharyngitis', code: 'DEMO-10034835' },
  { soc: 'Respiratory, thoracic and mediastinal disorders', pt: 'Nasal congestion', code: 'DEMO-10028735' },
  { soc: 'Respiratory, thoracic and mediastinal disorders', pt: 'Epistaxis', code: 'DEMO-10015090' },

  // Cardiac and vascular disorders (SOC: 10007541 / 10047065)
  { soc: 'Cardiac and vascular disorders', pt: 'Palpitations', code: 'DEMO-10033557' },
  { soc: 'Cardiac and vascular disorders', pt: 'Tachycardia', code: 'DEMO-10043071' },
  { soc: 'Cardiac and vascular disorders', pt: 'Hypertension', code: 'DEMO-10020772' },
  { soc: 'Cardiac and vascular disorders', pt: 'Hypotension', code: 'DEMO-10021097' },

  // Renal and urinary disorders (SOC: 10038359)
  { soc: 'Renal and urinary disorders', pt: 'Dysuria', code: 'DEMO-10013992' },
  { soc: 'Renal and urinary disorders', pt: 'Pollakiuria', code: 'DEMO-10036064' },
  { soc: 'Renal and urinary disorders', pt: 'Chromaturia', code: 'DEMO-10008851' },

  // Investigations (SOC: 10022891)
  { soc: 'Investigations', pt: 'Alanine aminotransferase increased', code: 'DEMO-10001551' },
  { soc: 'Investigations', pt: 'Aspartate aminotransferase increased', code: 'DEMO-10003481' },
  { soc: 'Investigations', pt: 'Blood creatinine increased', code: 'DEMO-10005483' },
  { soc: 'Investigations', pt: 'Blood pressure increased', code: 'DEMO-10005748' },
  { soc: 'Investigations', pt: 'Heart rate increased', code: 'DEMO-10019293' },

  // Psychiatric disorders (SOC: 10037175)
  { soc: 'Psychiatric disorders', pt: 'Insomnia', code: 'DEMO-10022437' },
  { soc: 'Psychiatric disorders', pt: 'Anxiety', code: 'DEMO-10002855' },
  { soc: 'Psychiatric disorders', pt: 'Restlessness', code: 'DEMO-10038743' },
];

// ~40 Classical Ayurvedic Formulations labeled DEMO DICTIONARY
const DEMO_AYURVEDIC_FORMULATIONS = [
  // Guggulu Preparations
  { formulation: 'Yogaraja Guggulu', type: 'Guggulu / Vati', indication: 'Sandhivata, Amavata, Vata Vyadhi', ref: 'AFI Part-I' },
  { formulation: 'Mahayogaraja Guggulu', type: 'Guggulu / Vati', indication: 'Vatavyadhi, Gridhrasi, Sandhigata Vata', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Kaishore Guggulu', type: 'Guggulu / Vati', indication: 'Vatarakta, Kushta, Prameha', ref: 'Sharangadhara Samhita' },
  { formulation: 'Simhanada Guggulu', type: 'Guggulu / Vati', indication: 'Amavata, Khanja, Pangu', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Triphala Guggulu', type: 'Guggulu / Vati', indication: 'Bhagandara, Arsha, Shotha', ref: 'Sharangadhara Samhita' },
  { formulation: 'Kanchanara Guggulu', type: 'Guggulu / Vati', indication: 'Gandamala, Apachi, Granthi', ref: 'Sharangadhara Samhita' },
  { formulation: 'Punarnevadi Guggulu', type: 'Guggulu / Vati', indication: 'Vatarakta, Shotha, Gridhrasi', ref: 'Bharat Bhaishajya Ratnakara' },
  { formulation: 'Gokshuradi Guggulu', type: 'Guggulu / Vati', indication: 'Prameha, Mutrakrichhra, Ashmari', ref: 'Sharangadhara Samhita' },

  // Kwatha / Decoctions
  { formulation: 'Dashamula Kwatha', type: 'Kwatha Churna', indication: 'Vata Vyadhi, Shwasa, Kasa', ref: 'Sushruta Samhita' },
  { formulation: 'Rasnasaptaka Kwatha', type: 'Kwatha Churna', indication: 'Amavata, Katishula, Sandhishula', ref: 'Chakradatta' },
  { formulation: 'Maharasnadi Kwatha', type: 'Kwatha Churna', indication: 'Sarvanga Vata, Pakshaghata, Ardita', ref: 'Sharangadhara Samhita' },
  { formulation: 'Amrutottara Kwatha', type: 'Kwatha Churna', indication: 'Jwara, Amadosha, Aruchi', ref: 'Sahasrayoga' },
  { formulation: 'Nishamalaki Kwatha', type: 'Kwatha Churna', indication: 'Madhumeha, Netraroga', ref: 'Ashtanga Hridaya' },
  { formulation: 'Varunadi Kwatha', type: 'Kwatha Churna', indication: 'Kaphamedaja Roga, Ashmari, Shotha', ref: 'Ashtanga Hridaya' },

  // Asava / Arishta (Fermented Liquids)
  { formulation: 'Ashwagandharishta', type: 'Arishta', indication: 'Murchha, Apasmara, Karshya, Vata Vyadhi', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Balarishta', type: 'Arishta', indication: 'Dhatukshaya, Daurbalya, Vataroga', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Dasamoolarishta', type: 'Arishta', indication: 'Prasuti Roga, Vatavyadhi, Aruchi', ref: 'Sharangadhara Samhita' },
  { formulation: 'Arjunarishta (Parthadyarishta)', type: 'Arishta', indication: 'Hridroga, Moha, Raktapitta', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Draksharishta', type: 'Arishta', indication: 'Urakshata, Kshaya, Kasa, Shwasa', ref: 'Sharangadhara Samhita' },
  { formulation: 'Amritarishta', type: 'Arishta', indication: 'Sarva Jwara, Vishama Jwara, Daurbalya', ref: 'Bhaishajya Ratnavali' },

  // Churna / Powders
  { formulation: 'Triphala Churna', type: 'Churna', indication: 'Vibandha, Netraroga, Prameha, Deepana', ref: 'Charaka Samhita' },
  { formulation: 'Ashwagandha Churna', type: 'Churna', indication: 'Balya, Rasayana, Vata Shamana', ref: 'AFI Part-I' },
  { formulation: 'Trikatu Churna', type: 'Churna', indication: 'Agnimandya, Deepana, Pachana, Kasa', ref: 'Charaka Samhita' },
  { formulation: 'Shatavari Churna', type: 'Churna', indication: 'Rasayana, Stanyajanana, Pitta Shamana', ref: 'AFI Part-I' },
  { formulation: 'Avipattikara Churna', type: 'Churna', indication: 'Amlapitta, Vibandha, Agnimandya', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Hingwashtaka Churna', type: 'Churna', indication: 'Adhmana, Shula, Agnimandya, Gulma', ref: 'Ashtanga Hridaya' },

  // Taila / Medicated Oils
  { formulation: 'Mahanarayana Taila', type: 'Taila', indication: 'Vatavyadhi, Sandhigata Vata, Shula', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Kshirabala Taila', type: 'Taila', indication: 'Vatarakta, Vata Shamana, Rasayana', ref: 'Ashtanga Hridaya' },
  { formulation: 'Dhanwantaram Taila', type: 'Taila', indication: 'Vatavyadhi, Sutika Roga, Marmaghata', ref: 'Sahasrayoga' },
  { formulation: 'Sahacharadi Taila', type: 'Taila', indication: 'Katigraha, Gridhrasi, Khalli', ref: 'Ashtanga Hridaya' },
  { formulation: 'Murivenna', type: 'Taila', indication: 'Vrana, Asthibhanga, Marmaghata', ref: 'Sahasrayoga' },

  // Ghruta / Medicated Ghee
  { formulation: 'Brahmi Ghruta', type: 'Ghruta', indication: 'Smritikshaya, Unmada, Apasmara', ref: 'Ashtanga Hridaya' },
  { formulation: 'Panchatikta Ghruta Guggulu', type: 'Ghruta', indication: 'Kushta, Sandhigata Vata, Nadivrana', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Phala Ghruta', type: 'Ghruta', indication: 'Vandhyatva, Yonivyapat, Garbhapradam', ref: 'Ashtanga Hridaya' },
  { formulation: 'Tikta Ghruta', type: 'Ghruta', indication: 'Kushta, Raktapitta, Visarpa', ref: 'Charaka Samhita' },

  // Rasa / Bhasma / Vati Minerals
  { formulation: 'Arogyavardhini Vati', type: 'Rasaushadhi / Vati', indication: 'Kushta, Yakridvikara, Deepana, Pachana', ref: 'Rasaratna Samucchaya' },
  { formulation: 'Chandraprabha Vati', type: 'Vati', indication: 'Prameha, Mutrakrichhra, Ashmari, Dhatu Daurbalya', ref: 'Sharangadhara Samhita' },
  { formulation: 'Swarna Bhasma', type: 'Bhasma', indication: 'Rasayana, Ojovardhaka, Vishahara', ref: 'Rasatarangini' },
  { formulation: 'Vasantakusumakara Rasa', type: 'Rasaushadhi', indication: 'Madhumeha, Dhatukshaya, Rasayana', ref: 'Bhaishajya Ratnavali' },
  { formulation: 'Sutashekhara Rasa', type: 'Rasaushadhi', indication: 'Amlapitta, Chhardi, Shula', ref: 'Yogaratnakara' },
];

class CodingService {
  /**
   * Search demo MedDRA dictionary by query term or SOC
   */
  static searchMedDRA(query) {
    if (!query) return DEMO_MEDDRA_DICTIONARY.slice(0, 15);
    const q = query.toLowerCase().trim();
    return DEMO_MEDDRA_DICTIONARY.filter(
      item => item.pt.toLowerCase().includes(q) || item.soc.toLowerCase().includes(q)
    );
  }

  /**
   * Search classical Ayurvedic formulations dictionary
   */
  static searchAyurvedic(query) {
    if (!query) return DEMO_AYURVEDIC_FORMULATIONS.slice(0, 15);
    const q = query.toLowerCase().trim();
    return DEMO_AYURVEDIC_FORMULATIONS.filter(
      item =>
        item.formulation.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.indication.toLowerCase().includes(q)
    );
  }

  /**
   * Auto-suggest MedDRA coding for a verbatim AE description
   */
  static suggestCoding(verbatimTerm) {
    if (!verbatimTerm || typeof verbatimTerm !== 'string') {
      return {
        soc: 'General disorders and administration site conditions',
        pt: 'Fatigue',
        code: 'DEMO-10016256',
        matched: false,
      };
    }
    const q = verbatimTerm.toLowerCase().trim();
    const match = DEMO_MEDDRA_DICTIONARY.find(item => q.includes(item.pt.toLowerCase()));
    if (match) {
      return { ...match, matched: true };
    }
    // Partial substring fallback
    const partial = DEMO_MEDDRA_DICTIONARY.find(item => {
      const words = item.pt.toLowerCase().split(' ');
      return words.some(w => w.length > 3 && q.includes(w));
    });
    if (partial) {
      return { ...partial, matched: true };
    }

    return {
      soc: 'Gastrointestinal disorders',
      pt: 'Gastric irritation',
      code: 'DEMO-10017849',
      matched: false,
    };
  }
}

module.exports = {
  CodingService,
  DEMO_MEDDRA_DICTIONARY,
  DEMO_AYURVEDIC_FORMULATIONS,
};
