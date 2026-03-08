ALTER TABLE gear
  DROP CONSTRAINT IF EXISTS gear_category_check;

ALTER TABLE gear
  ADD CONSTRAINT gear_category_check
  CHECK (category IN (
    'turntable','cartridge','phono_preamp','preamp',
    'amplifier','receiver','speakers','headphones',
    'dac','subwoofer','tape_deck','cables_other'
  ));
