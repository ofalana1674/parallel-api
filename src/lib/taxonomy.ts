// Canonical 86-tag taxonomy — server-side validation source of truth

export const TAXONOMY = [
  {
    cat: 'sleep', label: 'Sleep', tags: [
      { id: 'sleep_cant',    text: "can't sleep again"    },
      { id: 'sleep_3am',     text: '3am thoughts'          },
      { id: 'sleep_over',    text: 'overslept again'       },
      { id: 'sleep_weird',   text: 'weird dreams'          },
      { id: 'sleep_nap',     text: 'mid-day crash'         },
    ],
  },
  {
    cat: 'grief', label: 'Loss & grief', tags: [
      { id: 'grief_fresh',   text: 'freshly grieving'        },
      { id: 'grief_anni',    text: 'anniversary of a loss'   },
      { id: 'grief_miss',    text: 'missing someone today'   },
      { id: 'grief_pet',     text: 'lost a pet'              },
      { id: 'grief_unsaid',  text: 'things left unsaid'      },
      { id: 'grief_suicidal',text: "grief so heavy I can't"  },
    ],
  },
  {
    cat: 'work', label: 'Work & career', tags: [
      { id: 'work_laid',     text: 'just got laid off'        },
      { id: 'work_quit',     text: 'thinking of quitting'     },
      { id: 'work_stuck',    text: 'career feels stuck'       },
      { id: 'work_sunday',   text: 'sunday dread'             },
      { id: 'work_praise',   text: 'no one noticed my work'   },
      { id: 'work_new',      text: 'first week at new job'    },
      { id: 'work_burnout',  text: 'completely burnt out'     },
      { id: 'work_fired',    text: 'just got fired'           },
      { id: 'work_toxic',    text: 'toxic workplace'          },
      { id: 'work_purpose',  text: 'work feels meaningless'   },
    ],
  },
  {
    cat: 'relationship', label: 'Relationships', tags: [
      { id: 'rel_breakup',   text: 'just broke up'             },
      { id: 'rel_lonely',    text: 'lonely in a relationship'  },
      { id: 'rel_fight',     text: 'after a big fight'         },
      { id: 'rel_single',    text: 'tired of being single'     },
      { id: 'rel_ghosted',   text: 'just got ghosted'          },
      { id: 'rel_crush',     text: 'unrequited feelings'       },
      { id: 'rel_divorce',   text: 'going through divorce'     },
      { id: 'rel_trust',     text: 'trust was broken'          },
      { id: 'rel_dv_unsafe', text: 'unsafe at home'            },
    ],
  },
  {
    cat: 'family', label: 'Family', tags: [
      { id: 'fam_tension',   text: 'family tension right now'  },
      { id: 'fam_parent',    text: 'hard parenting moment'     },
      { id: 'fam_estranged', text: 'estranged from family'     },
      { id: 'fam_caregive',  text: 'caregiver exhaustion'      },
      { id: 'fam_newbaby',   text: 'newborn exhaustion'        },
      { id: 'fam_aging',     text: 'aging parent worry'        },
    ],
  },
  {
    cat: 'health', label: 'Health & body', tags: [
      { id: 'hlth_diag',     text: 'recent diagnosis'           },
      { id: 'hlth_wait',     text: 'waiting on test results'    },
      { id: 'hlth_chronic',  text: 'chronic pain today'         },
      { id: 'hlth_appt',     text: 'dreading a doctors appt'    },
      { id: 'hlth_recovery', text: 'recovery is hard today'     },
      { id: 'hlth_body',     text: 'struggling with my body'    },
    ],
  },
  {
    cat: 'mental', label: 'Mind & mood', tags: [
      { id: 'ment_anx',             text: 'anxiety right now'         },
      { id: 'ment_low',             text: 'low for no reason'         },
      { id: 'ment_numb',            text: 'feeling numb'              },
      { id: 'ment_over',            text: 'overwhelmed'               },
      { id: 'ment_spiral',          text: 'stuck in a spiral'         },
      { id: 'ment_flat',            text: 'just flat today'           },
      { id: 'ment_rage',            text: "angry and don't know why"  },
      { id: 'ment_shame',           text: 'carrying shame'            },
      { id: 'mental_active_si',     text: 'thoughts of ending it'     },
      { id: 'mental_self_harm_urge',text: 'urge to hurt myself'       },
    ],
  },
  {
    cat: 'substance', label: 'Substances', tags: [
      { id: 'sub_sober',               text: 'trying to stay sober'     },
      { id: 'sub_relapse',             text: 'just relapsed'            },
      { id: 'sub_milestone',           text: 'sobriety milestone today' },
      { id: 'substance_overdose_fear', text: 'scared I took too much'   },
    ],
  },
  {
    cat: 'life', label: 'Big life moments', tags: [
      { id: 'life_move',    text: 'just moved somewhere new'  },
      { id: 'life_wed',     text: 'wedding this week'         },
      { id: 'life_grad',    text: 'post-graduation drift'     },
      { id: 'life_30',      text: 'milestone birthday dread'  },
      { id: 'life_newcity', text: 'know nobody in this city'  },
      { id: 'life_change',  text: 'everything is changing'    },
      { id: 'life_quarter', text: 'quarter life crisis'       },
      { id: 'life_mid',     text: 'mid life reckoning'        },
    ],
  },
  {
    cat: 'misc', label: 'Just right now', tags: [
      { id: 'misc_bored',    text: 'bored on a tuesday'           },
      { id: 'misc_know',     text: 'just needed someone to know'  },
      { id: 'misc_proud',    text: 'something small went right'   },
      { id: 'misc_wait',     text: 'waiting for something'        },
      { id: 'misc_restless', text: 'restless, no idea why'        },
      { id: 'misc_grateful', text: 'unexpectedly grateful'        },
      { id: 'misc_scared',   text: 'scared about the future'      },
      { id: 'misc_unseen',   text: 'feeling unseen'               },
    ],
  },
];

// Flat set of all valid tag IDs — used for server-side validation
export const CANONICAL_TAG_IDS = new Set(
  TAXONOMY.flatMap(cat => cat.tags.map(t => t.id))
);