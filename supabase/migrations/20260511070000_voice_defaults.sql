-- Runtime voice defaults for ElevenLabs TTS.
-- Routes still allow env overrides, but platform voice defaults now live in data.

insert into public.platform_settings (key, value)
values (
  'voice_defaults',
  jsonb_build_object(
    'elevenlabs_voice_id', 'SAz9YHcvj6GT2YYXdXww',
    'elevenlabs_model_id', 'eleven_flash_v2_5'
  )
)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
