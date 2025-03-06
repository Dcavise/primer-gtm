const str = 'import { supabase } from "@/integrations/supabase/client";';
const out = str.replace(
  /import (.*) from ['"]@\/integrations\/supabase\/client['"];/g,
  'import $1 from \'@/integrations/supabase-client\';'
);
console.log(out);