import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useSessionStore } from '../../stores/sessionStore';
import { API_URL } from '../../constants';

const TAXONOMY = [
  { cat: 'sleep', label: 'Sleep', tags: [
    { id: 'sleep_cant', text: "can't sleep again" },
    { id: 'sleep_3am',  text: '3am thoughts' },
    { id: 'sleep_over', text: 'overslept again' },
    { id: 'sleep_weird',text: 'weird dreams' },
    { id: 'sleep_tired',text: 'exhausted but wired' },
  ]},
  { cat: 'mental', label: 'Mind & mood', tags: [
    { id: 'ment_anx',   text: 'anxiety right now' },
    { id: 'ment_low',   text: 'low for no reason' },
    { id: 'ment_numb',  text: 'feeling numb' },
    { id: 'ment_over',  text: 'overwhelmed' },
    { id: 'ment_spiral',text: 'stuck in a spiral' },
    { id: 'ment_flat',  text: 'just flat today' },
  ]},
  { cat: 'work', label: 'Work & career', tags: [
    { id: 'work_laid',  text: 'just got laid off' },
    { id: 'work_quit',  text: 'thinking of quitting' },
    { id: 'work_stuck', text: 'career feels stuck' },
    { id: 'work_sunday',text: 'sunday dread' },
    { id: 'work_burn',  text: 'burned out' },
  ]},
  { cat: 'relationship', label: 'Relationships', tags: [
    { id: 'rel_breakup',text: 'just broke up' },
    { id: 'rel_lonely', text: 'lonely in a relationship' },
    { id: 'rel_fight',  text: 'after a big fight' },
    { id: 'rel_single', text: 'tired of being single' },
    { id: 'rel_ghosted',text: 'just got ghosted' },
  ]},
  { cat: 'grief', label: 'Loss & grief', tags: [
    { id: 'grief_fresh',text: 'freshly grieving' },
    { id: 'grief_miss', text: 'missing someone today' },
    { id: 'grief_anni', text: 'anniversary of a loss' },
  ]},
  { cat: 'misc', label: 'Just right now', tags: [
    { id: 'misc_know',    text: 'just needed someone to know' },
    { id: 'misc_restless',text: 'restless, no idea why' },
    { id: 'misc_bored',   text: 'bored on a tuesday' },
    { id: 'misc_wait',    text: 'waiting for something' },
    { id: 'misc_proud',   text: 'something small went right' },
  ]},
];

export default function TagSelectionScreen({ onEnterPool, onCrisis }: {
  onEnterPool: () => void;
  onCrisis: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { sessionId, setStatus, setTags } = useSessionStore();

  const toggleTag = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(t => t !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleFindParallel = async () => {
    if (!selected.length || !sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/session/${sessionId}/enter-pool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: selected }),
      });
      const data = await res.json();
      if (data.action === 'crisis_routing') {
        onCrisis();
      } else {
        setTags(selected);
        setStatus('in_pool');
        onEnterPool();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.wm}>par<Text style={s.wmi}>all</Text>el</Text>
        <Text style={s.sub}>what's your moment right now?</Text>
      </View>

      {selected.length > 0 && (
        <View style={s.selBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {selected.map(id => {
              const tag = TAXONOMY.flatMap(c => c.tags).find(t => t.id === id);
              return (
                <TouchableOpacity key={id} style={s.selChip} onPress={() => toggleTag(id)}>
                  <Text style={s.selChipText}>{tag?.text}  ×</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={s.selCount}>{selected.length}/3</Text>
        </View>
      )}

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {TAXONOMY.map(cat => (
          <View key={cat.cat} style={s.section}>
            <Text style={s.catLabel}>{cat.label}</Text>
            <View style={s.tagGrid}>
              {cat.tags.map(tag => {
                const isSel = selected.includes(tag.id);
                const atMax = selected.length >= 3 && !isSel;
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[s.tag, isSel && s.tagSel, atMax && s.tagDim]}
                    onPress={() => !atMax && toggleTag(tag.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.tagText, isSel && s.tagTextSel]}>{tag.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.cta, (!selected.length || loading) && s.ctaDim]}
          onPress={handleFindParallel}
          disabled={!selected.length || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>find my parallel</Text>
          }
        </TouchableOpacity>
        <Text style={s.safetyNote}>if you're in crisis, we'll connect you with support first</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F5F5F7' },
  header:      { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  wm:          { fontSize: 28, fontWeight: '700', color: '#111' },
  wmi:         { fontStyle: 'italic' },
  sub:         { fontSize: 14, color: '#AAA', fontStyle: 'italic', marginTop: 4 },
  selBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E8E4DF' },
  selChip:     { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  selChipText: { color: '#fff', fontSize: 13, fontStyle: 'italic' },
  selCount:    { fontSize: 11, color: '#8B6914', fontWeight: '500', marginLeft: 8 },
  scroll:      { flex: 1, paddingHorizontal: 20 },
  section:     { marginTop: 24 },
  catLabel:    { fontSize: 10, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: '#AAA', marginBottom: 10 },
  tagGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:         { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E4DF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  tagSel:      { backgroundColor: '#111', borderColor: '#111' },
  tagDim:      { opacity: 0.3 },
  tagText:     { fontSize: 13, color: '#444', fontStyle: 'italic' },
  tagTextSel:  { color: '#fff' },
  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: '#F5F5F7' },
  cta:         { backgroundColor: '#111', borderRadius: 16, padding: 16, alignItems: 'center' },
  ctaDim:      { opacity: 0.3 },
  ctaText:     { color: '#fff', fontSize: 15, fontWeight: '500' },
  safetyNote:  { fontSize: 11, color: '#AAA', textAlign: 'center', marginTop: 10 },
});
