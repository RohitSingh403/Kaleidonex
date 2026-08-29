CREATE POLICY "employee docs read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "employee docs insert own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "employee docs update own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "employee docs delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);