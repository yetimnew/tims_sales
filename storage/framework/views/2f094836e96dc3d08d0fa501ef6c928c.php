<div
    class="relative text-neutral-400 dark:text-neutral-400"
    x-data="{ spotlight: { x: 0, y: 0 } }"
    @mousemove="const rect = $el.getBoundingClientRect(); spotlight = { x: $event.clientX - rect.left, y: $event.clientY - rect.top }">
    <div
        class="absolute w-full text-neutral-800 dark:text-neutral-100"
        x-data="{ isDark: window.matchMedia('(prefers-color-scheme: dark)').matches || document.documentElement.classList.contains('dark') }"
        :style="
            'mask-image: radial-gradient(circle at ' +
                spotlight.x +
                'px ' +
                spotlight.y +
                'px, black 0%, transparent ' + (isDark ? '150px' : '120px') + '); -webkit-mask-image: radial-gradient(circle at ' +
                spotlight.x +
                'px ' +
                spotlight.y +
                'px, black 0%, transparent ' + (isDark ? '600px' : '400px') + ');'
        ">
        <?php if (isset($component)) { $__componentOriginal2a45ee13943eadc15ee63d255f492356 = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginal2a45ee13943eadc15ee63d255f492356 = $attributes; } ?>
<?php $component = Illuminate\View\AnonymousComponent::resolve(['view' => 'laravel-exceptions-renderer::components.icons.laravel-ascii','data' => []] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('laravel-exceptions-renderer::icons.laravel-ascii'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\Illuminate\View\AnonymousComponent::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?>
<?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginal2a45ee13943eadc15ee63d255f492356)): ?>
<?php $attributes = $__attributesOriginal2a45ee13943eadc15ee63d255f492356; ?>
<?php unset($__attributesOriginal2a45ee13943eadc15ee63d255f492356); ?>
<?php endif; ?>
<?php if (isset($__componentOriginal2a45ee13943eadc15ee63d255f492356)): ?>
<?php $component = $__componentOriginal2a45ee13943eadc15ee63d255f492356; ?>
<?php unset($__componentOriginal2a45ee13943eadc15ee63d255f492356); ?>
<?php endif; ?>
    </div>
    <?php if (isset($component)) { $__componentOriginal2a45ee13943eadc15ee63d255f492356 = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginal2a45ee13943eadc15ee63d255f492356 = $attributes; } ?>
<?php $component = Illuminate\View\AnonymousComponent::resolve(['view' => 'laravel-exceptions-renderer::components.icons.laravel-ascii','data' => []] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('laravel-exceptions-renderer::icons.laravel-ascii'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\Illuminate\View\AnonymousComponent::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?>
<?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginal2a45ee13943eadc15ee63d255f492356)): ?>
<?php $attributes = $__attributesOriginal2a45ee13943eadc15ee63d255f492356; ?>
<?php unset($__attributesOriginal2a45ee13943eadc15ee63d255f492356); ?>
<?php endif; ?>
<?php if (isset($__componentOriginal2a45ee13943eadc15ee63d255f492356)): ?>
<?php $component = $__componentOriginal2a45ee13943eadc15ee63d255f492356; ?>
<?php unset($__componentOriginal2a45ee13943eadc15ee63d255f492356); ?>
<?php endif; ?>
</div>
<<<<<<<< HEAD:storage/framework/views/b83bbcb92d5bac4353b83ec5a1b874c7.php
<?php /**PATH C:\laragon\www\react-starter-kit\react-starter-kit\vendor\laravel\framework\src\Illuminate\Foundation\Providers/../resources/exceptions/renderer/components/laravel-ascii-spotlight.blade.php ENDPATH**/ ?>
========
<?php /**PATH C:\laragon\www\react-starter-kit\vendor\laravel\framework\src\Illuminate\Foundation\Providers/../resources/exceptions/renderer/components/laravel-ascii-spotlight.blade.php ENDPATH**/ ?>
>>>>>>>> 84056c8d62ffaf948baefbe40c767661a926c41e:storage/framework/views/2f094836e96dc3d08d0fa501ef6c928c.php
