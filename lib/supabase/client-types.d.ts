/**
 * 🔧 Supabase TypeScript Fix
 * 
 * Custom type definitions to fix TypeScript inference issues during build
 * Sources: 
 * - https://github.com/supabase/postgrest-js/issues/420
 * - https://github.com/supabase/supabase-js/issues/1288
 */

import { PostgrestBuilder, PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

declare module '@supabase/supabase-js' {
  interface SupabaseClient<
    DatabaseGeneric = any,
    SchemaName extends string & keyof DatabaseGeneric = 'public' extends keyof DatabaseGeneric
      ? 'public'
      : string & keyof DatabaseGeneric,
    Schema extends Record<string, any> = DatabaseGeneric[SchemaName]
  > {
    rpc<ResponseType = any, ParamsType = any>(
      fn: string,
      params?: ParamsType
    ): PostgrestBuilder<ResponseType>
    
    from<TableName extends string & keyof Schema['Tables']>(
      relation: TableName
    ): PostgrestQueryBuilder<
      Schema['Tables'][TableName]['Row'],
      Schema['Tables'][TableName]['Row']
    >
  }
}

// Ensure our Database type is always available
export type TypedSupabaseClient = SupabaseClient<Database>