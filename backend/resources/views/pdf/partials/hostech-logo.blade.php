@php
    $hostechPdfLogoPath = public_path('images/hostech-logo.png');
    $hostechPdfLogoUri = is_readable($hostechPdfLogoPath)
        ? 'data:image/png;base64,' . base64_encode((string) file_get_contents($hostechPdfLogoPath))
        : '';
@endphp
@if ($hostechPdfLogoUri !== '')
    <div style="display:inline-block;background:#fff;padding:5px;border-radius:10px;border:1px solid #e5e7eb;">
        <img src="{{ $hostechPdfLogoUri }}" width="56" height="56" alt="" style="display:block;"/>
    </div>
@endif
